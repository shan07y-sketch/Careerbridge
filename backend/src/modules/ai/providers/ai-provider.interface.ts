export interface AIProviderResult {
  text: string;
  tokensIn: number;
  tokensOut: number;
  model: string;
  provider: string;
}

export interface IAIProvider {
  /**
   * @param prompt The fully-built prompt (template + input) from PromptBuilder.
   * @param feature The prompt version id, e.g. 'resume-analysis-v1'.
   * @param rawInput The original, un-templated input text passed to
   *   AIOrchestrator.runAnalysis. Optional for backward compatibility with
   *   providers that only need the composed `prompt` (e.g. GeminiProvider);
   *   providers that call a structured API (e.g. the local AI Engine) need
   *   the raw text rather than a natural-language instruction wrapped
   *   around it.
   */
  generate(prompt: string, feature: string, rawInput?: string): Promise<AIProviderResult>;
}
