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

/**
 * Pulls the human-readable reason out of a Google API error envelope
 * ({ error: { message } }), falling back to the raw body when the response
 * is not the expected shape (e.g. an HTML error page from a proxy).
 */
function extractGoogleError(body: string): string {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string; status?: string } };
    if (parsed.error?.message) {
      return parsed.error.status ? `${parsed.error.status}: ${parsed.error.message}` : parsed.error.message;
    }
  } catch {
    // Not JSON - fall through to the raw body.
  }
  return body || 'Upstream returned an empty error body.';
}

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

/** Streaming endpoint variant of resolveEndpoint (SSE, streamGenerateContent). */
function resolveStreamEndpoint(apiKey: string, model: string): { url: string; headers: Record<string, string> } {
  const isVertexExpressKey =
    env.GEMINI_ENDPOINT === 'vertex' ||
    (env.GEMINI_ENDPOINT === 'auto' && apiKey.startsWith('AQ.'));
  const base = isVertexExpressKey
    ? `https://aiplatform.googleapis.com/v1/publishers/google/models/${model}:streamGenerateContent`
    : `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent`;
  return {
    url: `${base}?alt=sse`,
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }
  };
}

export interface GeminiProbeResult {
  provider: string;
  model: string;
  /** Which Google API the key is being routed to, and why. */
  endpoint: { host: string; mode: 'developer' | 'vertex'; routedBy: 'env-override' | 'key-prefix' };
  keyType: 'developer' | 'vertex-express' | 'none';
  status: 'live' | 'degraded' | 'unconfigured';
  /** What callers would actually get right now from an AI feature. */
  generation: 'live' | 'fallback';
  latencyMs: number | null;
  /** Populated only when status !== 'live'. Never contains the API key. */
  error: { httpStatus: number | null; code: string; message: string } | null;
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
   * Makes one real, minimal Gemini call to prove the configured key/endpoint/
   * model actually generate. Unlike getHealth (which only echoes env presence
   * and so cannot distinguish "configured" from "working"), this is the only
   * way to answer "is AI live right now" without driving a product feature.
   *
   * Deliberately does NOT reuse generate(): no retries (a probe should report
   * the first failure, not mask it behind 3 backoffs), no JSON response mode,
   * and it resolves rather than throws so callers get diagnostics either way.
   */
  static async probe(): Promise<GeminiProbeResult> {
    const model = env.GEMINI_MODEL;
    const isVertex =
      env.GEMINI_ENDPOINT === 'vertex' ||
      (env.GEMINI_ENDPOINT === 'auto' && (env.GEMINI_API_KEY ?? '').startsWith('AQ.'));
    const base: GeminiProbeResult = {
      provider: env.AI_PROVIDER,
      model,
      endpoint: {
        host: isVertex ? 'aiplatform.googleapis.com' : 'generativelanguage.googleapis.com',
        mode: isVertex ? 'vertex' : 'developer',
        routedBy: env.GEMINI_ENDPOINT === 'auto' ? 'key-prefix' : 'env-override'
      },
      keyType: this.keyType,
      status: 'unconfigured',
      generation: 'fallback',
      latencyMs: null,
      error: null
    };

    if (!env.GEMINI_API_KEY || env.AI_PROVIDER !== 'gemini') {
      base.error = {
        httpStatus: null,
        code: 'AI_NOT_CONFIGURED',
        message: !env.GEMINI_API_KEY
          ? 'GEMINI_API_KEY is not set; all AI modules run in deterministic Estimated mode.'
          : `AI_PROVIDER is "${env.AI_PROVIDER}", not "gemini".`
      };
      return base;
    }

    const { url, headers } = resolveEndpoint(env.GEMINI_API_KEY, model);
    const controller = new AbortController();
    // Short timeout: a health probe must not hang a dashboard for 60s.
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const startedAt = Date.now();

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Reply with the single word: LIVE' }] }],
          // gemini-flash-latest is a thinking model: reasoning tokens are drawn
          // from maxOutputTokens before any text is emitted, so a small budget
          // returns 200 with finishReason MAX_TOKENS and zero parts. Disabling
          // thinking keeps the probe to ~1 token and avoids a false "degraded".
          generationConfig: { temperature: 0, maxOutputTokens: 16, thinkingConfig: { thinkingBudget: 0 } }
        }),
        signal: controller.signal
      });
      base.latencyMs = Date.now() - startedAt;

      if (!resp.ok) {
        const body = await resp.text().catch(() => '');
        base.status = 'degraded';
        base.error = {
          httpStatus: resp.status,
          code: resp.status === 429 ? 'QUOTA_EXCEEDED' : resp.status === 403 ? 'ACCESS_FORBIDDEN' : resp.status === 404 ? 'MODEL_NOT_FOUND' : 'API_ERROR',
          // Google returns the reason in the body; it never echoes the key,
          // which we send as a header rather than a query param. Truncated so
          // a huge upstream payload cannot bloat the response.
          message: extractGoogleError(body).slice(0, 500)
        };
        logger.error({ status: resp.status, model, keyType: this.keyType }, '[GEMINI PROBE] Upstream rejected probe');
        return base;
      }

      const data = (await resp.json()) as {
        candidates?: { finishReason?: string; content?: { parts?: { text?: string }[] } }[];
      };
      const candidate = data.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;
      if (!text) {
        base.status = 'degraded';
        base.error = {
          httpStatus: 200,
          code: 'AI_EMPTY_RESPONSE',
          // finishReason is the difference between "model refused"
          // (SAFETY/RECITATION) and "budget too small" (MAX_TOKENS).
          message: `Gemini returned 200 with no candidate text (finishReason: ${candidate?.finishReason ?? 'unknown'}).`
        };
        return base;
      }

      base.status = 'live';
      base.generation = 'live';
      return base;
    } catch (err: any) {
      base.latencyMs = Date.now() - startedAt;
      base.status = 'degraded';
      const isTimeout = err?.name === 'AbortError';
      base.error = {
        httpStatus: null,
        code: isTimeout ? 'TIMEOUT_ERROR' : 'NETWORK_FAILURE',
        message: isTimeout ? 'Probe timed out after 10s.' : `Network connection failed: ${err?.message ?? 'unknown'}`
      };
      return base;
    } finally {
      clearTimeout(timeout);
    }
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
   * Multi-turn conversational streaming for the AI Career Coach chat. Streams
   * plain-text/markdown deltas via `onDelta` and resolves with the full text
   * plus token usage. Uses Gemini's SSE `streamGenerateContent?alt=sse`.
   * Throws (never falls back here) so the caller can decide how to degrade.
   */
  static async streamChat(params: {
    contents: ChatTurn[];
    systemInstruction: string;
    onDelta: (text: string) => void;
  }): Promise<GeminiGenerateResult> {
    if (!env.GEMINI_API_KEY) {
      throw new AppError('AI provider is not configured. Missing GEMINI_API_KEY.', 503, 'AI_NOT_CONFIGURED');
    }
    const model = env.GEMINI_MODEL;
    const { url, headers } = resolveStreamEndpoint(env.GEMINI_API_KEY, model);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          system_instruction: { parts: [{ text: params.systemInstruction }] },
          contents: params.contents.map(c => ({ role: c.role, parts: [{ text: c.text }] })),
          generationConfig: { temperature: 0.7, topP: 0.95 }
        }),
        signal: controller.signal
      });

      if (!resp.ok || !resp.body) {
        const body = await resp.text().catch(() => '');
        if (resp.status === 429) throw new AppError('Gemini API rate limit or quota exceeded.', 429, 'QUOTA_EXCEEDED');
        if (resp.status === 403 || resp.status === 404) {
          logger.error({ status: resp.status, body, model }, '[GEMINI CLIENT] Streaming access/model error');
          throw new AppError(`Model ${model} is unavailable for the configured API key.`, 503, 'MODEL_UNAVAILABLE');
        }
        throw new AppError(`Gemini streaming error (${resp.status}): ${body}`, 502, 'API_BAD_GATEWAY');
      }

      const reader = (resp.body as unknown as ReadableStream<Uint8Array>).getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let full = '';
      let usage: { promptTokenCount?: number; candidatesTokenCount?: number } | undefined;

      // Parse the SSE stream: each event is a `data: {json}` line; a network
      // chunk may split a line, so only process up to the last newline.
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line.startsWith('data:')) continue;
          const json = line.slice(5).trim();
          if (!json || json === '[DONE]') continue;
          try {
            const obj = JSON.parse(json) as {
              candidates?: { content?: { parts?: { text?: string }[] } }[];
              usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
            };
            const delta = obj.candidates?.[0]?.content?.parts?.[0]?.text;
            if (delta) { full += delta; params.onDelta(delta); }
            if (obj.usageMetadata) usage = obj.usageMetadata;
          } catch {
            // Ignore a malformed/partial data line; the SSE framing keeps
            // whole JSON objects on single lines, so this is rare.
          }
        }
      }

      if (!full) throw new AppError('Gemini returned no streamed text.', 502, 'AI_EMPTY_RESPONSE');
      logger.info({ model, chars: full.length }, '[GEMINI CLIENT] Streaming chat completed');
      return {
        text: full,
        tokensIn: usage?.promptTokenCount ?? 0,
        tokensOut: usage?.candidatesTokenCount ?? Math.floor(full.length / 4),
        model
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      const isTimeout = err?.name === 'AbortError';
      throw new AppError(
        isTimeout ? 'Gemini API request timed out.' : `Network connection failed: ${err?.message ?? 'unknown'}`,
        isTimeout ? 504 : 503,
        isTimeout ? 'TIMEOUT_ERROR' : 'NETWORK_FAILURE'
      );
    } finally {
      clearTimeout(timeout);
    }
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
