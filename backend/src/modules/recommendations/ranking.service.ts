/**
 * Ranking / recommendation layer.
 *
 * PRINCIPLE: The database is the single source of truth. This layer NEVER
 * invents entities -- it only takes a set of real rows already fetched from
 * PostgreSQL and returns an ordering, a 0-100 score, and human-readable
 * reasons ("explanations"). The full set is always still available to the
 * caller; ranking just decides what to surface first.
 *
 * The provider is deliberately behind an interface (`IRankingProvider`) so a
 * future LLM-backed ranker can be swapped in without touching call sites.
 * The default `DeterministicRankingProvider` is transparent, cheap, and always
 * available (no external dependency), matching the platform's AI-adapter
 * philosophy of a deterministic fallback.
 */

export interface Ranked<T> {
  item: T;
  score: number; // 0-100
  reasons: string[];
}

export interface StudentSignal {
  skills?: { name: string; level?: number }[];
  preferredLocation?: string;
  workMode?: string;
  gradYear?: number;
  careerGoal?: string;
}

export interface JobSignal {
  id: string;
  title?: string;
  location?: string;
  workMode?: string;
  jobType?: string;
  requiredSkills?: string[];
  postedAt?: Date | string | null;
}

export interface CompanySignal {
  id: string;
  industry?: string;
  openJobsCount?: number;
  rating?: number;
  requiredSkills?: string[];
}

export interface MentorSignal {
  id: string;
  expertise?: string[];
  rating?: number;
  reviewsCount?: number;
}

const norm = (s: string) => s.trim().toLowerCase();

function skillSet(skills?: { name: string }[] | string[]): Set<string> {
  if (!skills) return new Set();
  return new Set(
    (skills as any[]).map((s) => (typeof s === 'string' ? s : s?.name)).filter(Boolean).map(norm)
  );
}

/** Jaccard-style overlap ratio (0..1) plus the count of shared items. */
function overlap(a: Set<string>, b: Set<string>): { ratio: number; shared: string[] } {
  if (a.size === 0 || b.size === 0) return { ratio: 0, shared: [] };
  const shared = [...a].filter((x) => b.has(x));
  return { ratio: shared.length / Math.max(a.size, b.size), shared };
}

/** Recency score: newer = higher, decaying to ~0 over 60 days. */
function recencyScore(postedAt?: Date | string | null): number {
  if (!postedAt) return 0;
  const t = new Date(postedAt).getTime();
  if (Number.isNaN(t)) return 0;
  const days = (Date.now() - t) / (1000 * 60 * 60 * 24);
  return Math.max(0, 1 - days / 60);
}

export interface IRankingProvider {
  readonly name: string;
  rankJobsForStudent(student: StudentSignal, jobs: JobSignal[], limit?: number): Ranked<JobSignal>[];
  rankCandidatesForJob(job: JobSignal, students: (StudentSignal & { id: string })[], limit?: number): Ranked<StudentSignal & { id: string }>[];
  rankCompaniesForStudent(student: StudentSignal, companies: CompanySignal[], limit?: number): Ranked<CompanySignal>[];
  rankMentorsForStudent(student: StudentSignal, mentors: MentorSignal[], limit?: number): Ranked<MentorSignal>[];
}

export class DeterministicRankingProvider implements IRankingProvider {
  readonly name = 'deterministic-v1';

  rankJobsForStudent(student: StudentSignal, jobs: JobSignal[], limit = 20): Ranked<JobSignal>[] {
    const studentSkills = skillSet(student.skills);
    const ranked = jobs.map((job) => {
      const reasons: string[] = [];
      const { ratio, shared } = overlap(studentSkills, skillSet(job.requiredSkills));
      let score = ratio * 60;
      if (shared.length) reasons.push(`Matches ${shared.length} of your skills: ${shared.slice(0, 3).join(', ')}`);

      if (student.preferredLocation && job.location && norm(job.location).includes(norm(student.preferredLocation))) {
        score += 15;
        reasons.push(`Located in your preferred area (${job.location})`);
      }
      if (student.workMode && job.workMode && norm(student.workMode) === norm(job.workMode)) {
        score += 10;
        reasons.push(`${job.workMode} — your preferred work mode`);
      }
      const rec = recencyScore(job.postedAt);
      score += rec * 15;
      if (rec > 0.7) reasons.push('Recently posted');

      if (!reasons.length) reasons.push('Open opportunity in the platform');
      return { item: job, score: Math.round(Math.min(100, score)), reasons };
    });
    return ranked.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  rankCandidatesForJob(job: JobSignal, students: (StudentSignal & { id: string })[], limit = 20): Ranked<StudentSignal & { id: string }>[] {
    const jobSkills = skillSet(job.requiredSkills);
    const ranked = students.map((student) => {
      const reasons: string[] = [];
      const { ratio, shared } = overlap(skillSet(student.skills), jobSkills);
      let score = ratio * 70;
      if (shared.length) reasons.push(`Has ${shared.length} required skill(s): ${shared.slice(0, 3).join(', ')}`);

      if (student.workMode && job.workMode && norm(student.workMode) === norm(job.workMode)) {
        score += 10;
        reasons.push(`Open to ${job.workMode} work`);
      }
      if (student.preferredLocation && job.location && norm(job.location).includes(norm(student.preferredLocation))) {
        score += 10;
        reasons.push('Located near the role');
      }
      if (student.gradYear) {
        const yearsOut = student.gradYear - new Date().getFullYear();
        if (yearsOut <= 1) {
          score += 10;
          reasons.push('Graduating soon — available to hire');
        }
      }
      if (!reasons.length) reasons.push('In the student talent pool');
      return { item: student, score: Math.round(Math.min(100, score)), reasons };
    });
    return ranked.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  rankCompaniesForStudent(student: StudentSignal, companies: CompanySignal[], limit = 20): Ranked<CompanySignal>[] {
    const studentSkills = skillSet(student.skills);
    const ranked = companies.map((company) => {
      const reasons: string[] = [];
      const { ratio, shared } = overlap(studentSkills, skillSet(company.requiredSkills));
      let score = ratio * 45;
      if (shared.length) reasons.push(`Hiring for skills you have: ${shared.slice(0, 3).join(', ')}`);

      const openJobs = company.openJobsCount ?? 0;
      score += Math.min(25, openJobs * 5);
      if (openJobs > 0) reasons.push(`${openJobs} open role${openJobs > 1 ? 's' : ''}`);

      if (typeof company.rating === 'number' && company.rating > 0) {
        score += (company.rating / 5) * 20;
        reasons.push(`Rated ${company.rating.toFixed(1)}/5 by the community`);
      }
      if (student.careerGoal && company.industry && norm(company.industry).includes(norm(student.careerGoal.split(' ')[0] || ''))) {
        score += 10;
        reasons.push(`Aligned with your goal (${company.industry})`);
      }
      if (!reasons.length) reasons.push('Company on the platform');
      return { item: company, score: Math.round(Math.min(100, score)), reasons };
    });
    return ranked.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  rankMentorsForStudent(student: StudentSignal, mentors: MentorSignal[], limit = 20): Ranked<MentorSignal>[] {
    const studentSkills = skillSet(student.skills);
    const ranked = mentors.map((mentor) => {
      const reasons: string[] = [];
      const { ratio, shared } = overlap(studentSkills, skillSet(mentor.expertise));
      let score = ratio * 55;
      if (shared.length) reasons.push(`Expert in areas you're growing: ${shared.slice(0, 3).join(', ')}`);

      if (typeof mentor.rating === 'number' && mentor.rating > 0) {
        score += (mentor.rating / 5) * 30;
      }
      const reviews = mentor.reviewsCount ?? 0;
      score += Math.min(15, reviews * 3);
      if (reviews > 0) reasons.push(`${reviews} mentee session${reviews > 1 ? 's' : ''} completed`);

      if (!reasons.length) reasons.push('Available mentor');
      return { item: mentor, score: Math.round(Math.min(100, score)), reasons };
    });
    return ranked.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}

/** Singleton default provider. Swap here to introduce an LLM-backed ranker. */
export const rankingProvider: IRankingProvider = new DeterministicRankingProvider();
