export interface AIProviderResult {
  text: string;
  tokensIn: number;
  tokensOut: number;
  model: string;
  provider: string;
}

export interface IAIProvider {
  generate(prompt: string, feature: string): Promise<AIProviderResult>;
}
