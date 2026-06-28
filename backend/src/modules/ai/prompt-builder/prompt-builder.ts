export class PromptBuilder {
  private static prompts: { [key: string]: string } = {
    'resume-analysis-v1': 'Analyze the following resume text and provide a structured JSON scoring and improvement recommendations: {input}',
    'career-insight-v1': 'Generate AI career insights, scoring, and technology recommendations for the following student profile: {input}',
    'job-match-v1': 'Compare the student profile skills against the following job description and provide a match percentage and explanation: {input}',
    'interview-analysis-v1': 'Evaluate the mock interview transcripts and generate a constructive summary and readiness score: {input}',
    'network-recommendation-v1': 'Recommend peer connections or mentor lists based on this profile: {input}'
  };

  static buildPrompt(versionId: string, input: string): string {
    const template = this.prompts[versionId];
    if (!template) {
      throw new Error(`Prompt template ${versionId} is not registered.`);
    }
    return template.replace('{input}', input);
  }
}
