import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { AppError } from '../../utils/app-error';

export interface GeminiGenerateResult {
  text: string;
  tokensIn: number;
  tokensOut: number;
  model: string;
}

const REQUEST_TIMEOUT_MS = 60_000;

/**
 * Google issues two kinds of Gemini keys, and each only works against its
 * own endpoint:
 *  - "AIza..."  -> Gemini Developer API (generativelanguage.googleapis.com)
 *  - "AQ...."   -> Vertex AI express-mode key (aiplatform.googleapis.com)
 * Sending a Vertex express key to generativelanguage (or vice versa) yields
 * 403 "Access forbidden" / "Gemini unavailable". We route by key format.
 */
function resolveEndpoint(apiKey: string, model: string): { url: string; headers: Record<string, string> } {
  const isVertexExpressKey =
    env.GEMINI_ENDPOINT === 'vertex' ||
    (env.GEMINI_ENDPOINT === 'auto' && apiKey.startsWith('AQ.'));
  if (isVertexExpressKey) {
    return {
      url: `https://aiplatform.googleapis.com/v1/publishers/google/models/${model}:generateContent`,
      // Vertex express mode accepts the key via the standard Google API key header.
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }
    };
  }
  return {
    // Key sent via header (not query string) so it never appears in URLs/logs.
    url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }
  };
}

export class GeminiClient {
  static get isConfigured(): boolean {
    return Boolean(env.GEMINI_API_KEY);
  }

  static get keyType(): 'developer' | 'vertex-express' | 'none' {
    if (!env.GEMINI_API_KEY) return 'none';
    return env.GEMINI_API_KEY.startsWith('AQ.') ? 'vertex-express' : 'developer';
  }

  /**
   * Sends a single-turn prompt to Gemini with timeout and exponential backoff retry.
   */
  static async generate(prompt: string, feature: string): Promise<GeminiGenerateResult> {
    if (!env.GEMINI_API_KEY) {
      throw new AppError('AI provider is not configured. Missing GEMINI_API_KEY.', 503, 'AI_NOT_CONFIGURED');
    }

    const model = env.GEMINI_MODEL;
    const { url, headers } = resolveEndpoint(env.GEMINI_API_KEY, model);

    let lastError: any = null;
    let delay = 1000;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.4,
              responseMimeType: 'application/json'
            }
          }),
          signal: controller.signal
        });

        clearTimeout(timeout);

        if (!resp.ok) {
          const body = await resp.text().catch(() => '');
          let statusError: AppError;

          if ((resp.status === 400 || resp.status === 401) && /API key not valid|API_KEY_INVALID|UNAUTHENTICATED/i.test(body)) {
            statusError = new AppError('The configured Gemini API key is invalid.', 401, 'INVALID_API_KEY');
          } else if (resp.status === 429) {
            statusError = new AppError('Gemini API rate limit or quota exceeded.', 429, 'QUOTA_EXCEEDED');
          } else if (resp.status === 403) {
            // Log the full body server-side; a 403 here usually means the key
            // type does not match the endpoint (see resolveEndpoint above) or
            // the key's project has no access to this model.
            logger.error({ status: resp.status, body, keyType: this.keyType, model }, '[GEMINI CLIENT] Access forbidden');
            statusError = new AppError(`Access to model ${model} is forbidden for the configured API key.`, 503, 'MODEL_UNAVAILABLE');
          } else if (resp.status === 404) {
            statusError = new AppError(`Model ${model} was not found on the configured Gemini endpoint.`, 503, 'MODEL_UNAVAILABLE');
          } else {
            statusError = new AppError(`Gemini API error (${resp.status}): ${body}`, 502, 'API_BAD_GATEWAY');
          }

          // If transient error, retry
          if ((resp.status === 429 || resp.status >= 500) && attempt < maxRetries) {
            logger.warn({ attempt, status: resp.status }, `Transient Gemini API error. Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
            continue;
          }
          throw statusError;
        }

        const data = (await resp.json()) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
          usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
        };

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          throw new AppError('Gemini API returned no candidate text response.', 502, 'AI_EMPTY_RESPONSE');
        }

        logger.info({ feature, model, attempt }, '[GEMINI CLIENT] Request completed successfully');

        return {
          text,
          tokensIn: data.usageMetadata?.promptTokenCount ?? Math.floor(prompt.length / 4),
          tokensOut: data.usageMetadata?.candidatesTokenCount ?? Math.floor(text.length / 4),
          model
        };

      } catch (err: any) {
        clearTimeout(timeout);

        if (err instanceof AppError) {
          throw err;
        }

        const isTimeout = err.name === 'AbortError';
        const msg = isTimeout ? 'Gemini API request timed out.' : `Network connection failed: ${err.message}`;
        const errorCode = isTimeout ? 'TIMEOUT_ERROR' : 'NETWORK_FAILURE';
        
        lastError = new AppError(msg, isTimeout ? 504 : 503, errorCode);

        if (attempt < maxRetries) {
          logger.warn({ attempt, isTimeout }, `Gemini request failed. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }
      }
    }

    throw lastError || new AppError('Failed to contact Gemini API after multiple retries.', 503, 'AI_UNAVAILABLE');
  }

  /**
   * Parses JSON with smart substring extraction recovery and a single retry.
   */
  static async generateJSON<T>(prompt: string, feature: string): Promise<T> {
    let result: GeminiGenerateResult;
    try {
      result = await this.generate(prompt, feature);
    } catch (err) {
      throw err;
    }

    try {
      return this.cleanAndParse<T>(result.text);
    } catch (parseErr) {
      logger.warn({ text: result.text }, 'JSON parse failure. Retrying once with schema clarification...');
      const retryPrompt = `${prompt}\n\nCRITICAL: Return ONLY a valid JSON block, starting with { and ending with }. Do not wrap in markdown or prefix/suffix.`;
      try {
        const retryResult = await this.generate(retryPrompt, feature);
        return this.cleanAndParse<T>(retryResult.text);
      } catch (retryErr) {
        logger.error({ text: result.text, retryText: parseErr }, 'JSON parsing failed completely on retry.');
        throw new AppError('Gemini returned invalid or malformed JSON output.', 502, 'INVALID_JSON_RESPONSE');
      }
    }
  }

  private static cleanAndParse<T>(text: string): T {
    let cleaned = text.trim();
    cleaned = cleaned.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
    try {
      return JSON.parse(cleaned) as T;
    } catch (err) {
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const candidate = cleaned.substring(firstBrace, lastBrace + 1);
        return JSON.parse(candidate) as T;
      }
      throw err;
    }
  }
}
