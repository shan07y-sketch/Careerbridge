/**
 * Skill extraction interface for uploaded resumes.
 *
 * This follows the same "deterministic now, AI-swappable later" pattern as
 * the rest of the platform's AI-adjacent features (see
 * backend/src/modules/ai/ai-provider.interface.ts): callers depend on
 * `SkillExtractionService.extractSkills`, never on how the extraction is
 * implemented. Today that's a keyword match against a curated skills list
 * (no OCR/NLP dependency required). When real resume parsing + AI-based
 * extraction is wired up (via AIOrchestrator, the same as resume-analysis-v1),
 * only this file's internals change -- every caller (upload flow, recruiter
 * view, candidate search/filtering) keeps working unmodified.
 */

// A representative slice of skills relevant to the roles CareerBridge lists
// jobs for. In production this would be sourced from (or kept in sync with)
// the `Skill` table so extraction stays aligned with the platform's actual
// taxonomy; a static list keeps this interface fast and dependency-free for
// now.
const KNOWN_SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin',
  'React', 'Angular', 'Vue', 'Next.js', 'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot', '.NET',
  'HTML', 'CSS', 'Tailwind CSS', 'SASS', 'GraphQL', 'REST', 'gRPC',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQL', 'DynamoDB', 'Prisma', 'SQLAlchemy',
  'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'GitHub Actions', 'Jenkins',
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Data Analysis', 'Pandas', 'NumPy',
  'Git', 'Linux', 'Agile', 'Scrum', 'Product Management', 'UI/UX Design', 'Figma',
  'Cybersecurity', 'Penetration Testing', 'Networking', 'System Design', 'Microservices'
] as const;

export interface SkillExtractionResult {
  skills: string[];
  method: 'keyword-match-v1';
}

export class SkillExtractionService {
  /**
   * Extract a de-duplicated list of recognized skills from free text (a
   * resume's parsed content, or -- until real text parsing exists -- its
   * filename, which still gives a meaningfully better-than-nothing signal
   * for e.g. "Jane_Doe_React_Developer_Resume.pdf").
   */
  static extractSkills(sourceText: string): SkillExtractionResult {
    const haystack = sourceText.toLowerCase();
    const found = new Set<string>();

    for (const skill of KNOWN_SKILLS) {
      const needle = skill.toLowerCase();
      // Word-ish boundary check so "Go" doesn't match inside "Google" or
      // "Django" doesn't match inside some unrelated longer token.
      const pattern = new RegExp(`(?<![a-z0-9])${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z0-9])`, 'i');
      if (pattern.test(haystack)) {
        found.add(skill);
      }
    }

    return { skills: Array.from(found), method: 'keyword-match-v1' };
  }
}
