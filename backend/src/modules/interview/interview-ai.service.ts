import { logger } from '../../config/logger';
import { GeminiClient } from '../ai/gemini-client';
import { env } from '../../config/env';
import { InterviewContext } from './interview-context.service';

/**
 * InterviewAIService: the Mock Interview AI brain.
 *
 * Three responsibilities, all stateless (session state lives in PostgreSQL):
 *  1. generatePlan       -- personalized question plan from the candidate +
 *                           job context (no two interviews identical).
 *  2. evaluateAnswer     -- per-answer scoring of the REAL transcript.
 *  3. generateAdaptiveQuestion -- next question conditioned on performance
 *                           so far (struggling -> easier, excelling -> harder).
 *  4. synthesizeQualitative -- narrative sections of the final report,
 *                           grounded ONLY in the stored per-question data.
 *
 * Numeric report scores are NEVER produced here for the final report -- the
 * service layer aggregates them from stored per-question rows so every score
 * is traceable to the student's actual performance. Gemini writes prose;
 * arithmetic stays deterministic.
 *
 * Every method has a deterministic fallback that analyzes the actual
 * transcript/context (never invented performance) and is flagged
 * `estimated: true`, surfaced to users as "Estimated – AI unavailable".
 */

export type InterviewTypeKey = 'HR' | 'TECHNICAL' | 'BEHAVIORAL' | 'APTITUDE' | 'MIXED';
export type DifficultyKey = 'EASY' | 'MEDIUM' | 'HARD';

export interface PlannedQuestion {
  type: string;
  difficulty: string;
  text: string;
  expectedSkills: string[];
}

export interface AnswerEvaluation {
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  relevanceScore: number;
  completenessScore: number;
  grammarScore: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  suggestedBetterAnswer: string;
  estimated: boolean;
}

export interface AnswerHistoryItem {
  questionText: string;
  questionType: string;
  difficulty: string;
  transcript: string;
  overallScore: number;
}

export interface QualitativeReport {
  aiSummary: string;
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  improvementPlan: string[];
  learningRoadmap: { step: number; title: string; description: string; resources: string[] }[];
  suggestedCourses: string[];
  recommendedProjects: string[];
  recommendedCertifications: string[];
  careerRecommendations: string[];
  suggestedQuestions: string[];
  estimated: boolean;
}

const FILLER_WORDS = ['um', 'uh', 'erm', 'hmm', 'like', 'you know', 'basically', 'actually', 'literally', 'i mean', 'sort of', 'kind of'];

/** Delivery metrics computed from the REAL transcript + measured duration. */
export function computeDeliveryMetrics(transcript: string, durationSec: number | null) {
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const lower = ` ${transcript.toLowerCase()} `;
  const fillerWordCount = FILLER_WORDS.reduce((sum, f) => {
    const matches = lower.match(new RegExp(`[^a-z]${f.replace(/ /g, '\\s+')}[^a-z]`, 'g'));
    return sum + (matches ? matches.length : 0);
  }, 0);
  const wordsPerMinute =
    durationSec && durationSec > 3 ? Math.round((words.length / durationSec) * 60) : null;
  return { wordCount: words.length, fillerWordCount, wordsPerMinute };
}

function clampScore(n: unknown, fallback = 50): number {
  const v = typeof n === 'number' && Number.isFinite(n) ? Math.round(n) : fallback;
  return Math.max(0, Math.min(100, v));
}

function asStringArray(v: unknown, max = 10): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).slice(0, max);
}

const geminiEnabled = () => GeminiClient.isConfigured && env.AI_PROVIDER === 'gemini';

function describeCandidate(ctx: InterviewContext): string {
  const s = ctx.student;
  return [
    `Name: ${s.fullName}`,
    s.careerGoal ? `Career goal: ${s.careerGoal}` : null,
    s.university ? `University: ${s.university}${s.department ? `, ${s.department}` : ''}${s.graduationYear ? `, class of ${s.graduationYear}` : ''}` : null,
    s.gpa ? `GPA: ${s.gpa}` : null,
    s.skills.length ? `Skills: ${s.skills.map(k => `${k.name} (${k.level}/100)`).join(', ')}` : null,
    s.certifications.length ? `Certifications: ${s.certifications.map(c => `${c.name} (${c.issuingOrg})`).join(', ')}` : null,
    s.projects.length ? `Projects: ${s.projects.map(p => `${p.title} — ${p.description}`).join(' | ')}` : null,
    s.experience.length ? `Experience: ${s.experience.map(e => `${e.roleTitle} at ${e.companyName}`).join(', ')}` : null,
    s.latestResumeAnalysis ? `Latest resume analysis (score ${s.latestResumeAnalysis.score}/100): ${s.latestResumeAnalysis.summary}` : null,
    s.previousInterviews.length
      ? `Previous mock interviews: ${s.previousInterviews
          .map(p => `${p.jobTitle} (${p.interviewType}, ${p.difficulty}) scored ${p.overallScore ?? 'n/a'}; weaknesses: ${p.weaknesses.join('; ') || 'none recorded'}`)
          .join(' | ')}`
      : null,
    s.resumeExcerpt ? `Resume excerpt: ${s.resumeExcerpt}` : null
  ]
    .filter(Boolean)
    .join('\n');
}

function describeJob(ctx: InterviewContext): string {
  const j = ctx.job;
  return [
    `Job title: ${j.jobTitle}`,
    j.companyName ? `Company: ${j.companyName}` : null,
    j.requiredSkills.length ? `Required skills: ${j.requiredSkills.join(', ')}` : null,
    j.description ? `Job description: ${j.description}` : null,
    j.requirements ? `Requirements: ${j.requirements}` : null
  ]
    .filter(Boolean)
    .join('\n');
}

const TYPE_MIX: Record<InterviewTypeKey, string[]> = {
  HR: ['hr'],
  TECHNICAL: ['technical'],
  BEHAVIORAL: ['behavioral'],
  APTITUDE: ['aptitude'],
  MIXED: ['hr', 'technical', 'behavioral', 'technical', 'aptitude', 'behavioral', 'technical', 'hr', 'technical', 'behavioral']
};

export class InterviewAIService {
  // ---------------------------------------------------------------- plan --

  static async generatePlan(
    ctx: InterviewContext,
    interviewType: InterviewTypeKey,
    difficulty: DifficultyKey,
    numQuestions: number
  ): Promise<{ questions: PlannedQuestion[]; estimated: boolean }> {
    const fallback = () => ({
      questions: this.fallbackPlan(ctx, interviewType, difficulty, numQuestions),
      estimated: true
    });
    if (!geminiEnabled()) return fallback();

    try {
      const prompt = `You are a senior interviewer at ${ctx.job.companyName ?? 'a leading technology company'} preparing a personalized ${difficulty.toLowerCase()}-difficulty ${interviewType} mock interview for the role below. Craft ${numQuestions} interview questions SPECIFIC to this candidate — reference their actual projects, skills, experience and the job requirements. Avoid generic questions; no two candidates should get the same set. Probe previously-recorded weaknesses.

CANDIDATE:
${describeCandidate(ctx)}

TARGET JOB:
${describeJob(ctx)}

Question type rules: ${interviewType === 'MIXED' ? 'mix hr, technical, behavioral and aptitude questions' : `every question must be type "${interviewType.toLowerCase()}"`}. Order them like a real interview (warm-up first, hardest in the middle, closing question last).

Return ONLY valid JSON: { "questions": [ { "type": "hr|technical|behavioral|aptitude", "difficulty": "easy|medium|hard", "text": string, "expectedSkills": string[] } ] }`;

      const json = await GeminiClient.generateJSON<{ questions: PlannedQuestion[] }>(prompt, 'interview-plan-v2');
      const questions = (json.questions ?? [])
        .filter(q => q && typeof q.text === 'string' && q.text.trim().length > 0)
        .slice(0, numQuestions)
        .map(q => ({
          type: typeof q.type === 'string' ? q.type.toLowerCase() : 'technical',
          difficulty: typeof q.difficulty === 'string' ? q.difficulty.toLowerCase() : difficulty.toLowerCase(),
          text: q.text.trim(),
          expectedSkills: asStringArray(q.expectedSkills, 6)
        }));
      if (questions.length < Math.min(numQuestions, 3)) return fallback();
      // Top up from the fallback bank if Gemini under-delivered.
      const extra = this.fallbackPlan(ctx, interviewType, difficulty, numQuestions).filter(
        f => !questions.some(q => q.text === f.text)
      );
      while (questions.length < numQuestions && extra.length > 0) questions.push(extra.shift()!);
      return { questions, estimated: false };
    } catch (err) {
      logger.error({ err }, '[INTERVIEW AI] Gemini plan generation failed. Serving deterministic fallback plan.');
      return fallback();
    }
  }

  /**
   * Deterministic personalized plan: templates instantiated with the
   * candidate's real skills/projects/experience and the job's skills, so
   * even offline the interview is about THIS candidate.
   */
  private static fallbackPlan(
    ctx: InterviewContext,
    interviewType: InterviewTypeKey,
    difficulty: DifficultyKey,
    numQuestions: number
  ): PlannedQuestion[] {
    const skills = [
      ...new Set([...ctx.job.requiredSkills, ...ctx.student.skills.map(s => s.name), ...ctx.student.resumeSkills])
    ];
    const topSkill = skills[0] ?? 'your strongest technical skill';
    const secondSkill = skills[1] ?? 'a technology from the job description';
    const project = ctx.student.projects[0]?.title;
    const experience = ctx.student.experience[0];
    const role = ctx.job.jobTitle;
    const company = ctx.job.companyName ?? 'our company';

    const bank: Record<string, { d: DifficultyKey; text: string; skills: string[] }[]> = {
      hr: [
        { d: 'EASY', text: `Tell me about yourself and why you are interested in the ${role} role at ${company}.`, skills: [] },
        { d: 'EASY', text: `What do you know about ${company}, and why do you want to work here specifically?`, skills: [] },
        { d: 'MEDIUM', text: `Where do you see your career three years after joining as a ${role}, and how does this role get you there?`, skills: [] },
        { d: 'MEDIUM', text: `What would your previous teammates${experience ? ` at ${experience.companyName}` : ''} say is your biggest area for growth?`, skills: [] },
        { d: 'HARD', text: `If you received two offers — this ${role} position and a higher-paying role elsewhere — how would you decide? What actually matters to you?`, skills: [] }
      ],
      technical: [
        { d: 'EASY', text: `Walk me through the fundamentals of ${topSkill}. What problems does it solve and when would you avoid it?`, skills: [topSkill] },
        { d: 'MEDIUM', text: project
            ? `In your project "${project}", walk me through the architecture. What would you change if you rebuilt it today?`
            : `Describe the architecture of a system you have built. What would you change if you rebuilt it today?`, skills: [topSkill] },
        { d: 'MEDIUM', text: `How would you use ${topSkill} and ${secondSkill} together to build a feature required for a ${role} position? Be specific about trade-offs.`, skills: [topSkill, secondSkill] },
        { d: 'HARD', text: `Design a scalable system relevant to ${company}'s ${role} work. Cover data model, APIs, caching, and failure handling.`, skills: [topSkill, secondSkill] },
        { d: 'HARD', text: `A production incident: the feature you built with ${topSkill} is failing intermittently under load. Walk me through your debugging approach step by step.`, skills: [topSkill] }
      ],
      behavioral: [
        { d: 'EASY', text: `Describe a time you had to learn ${topSkill} or another technology quickly. How did you approach it?`, skills: [topSkill] },
        { d: 'MEDIUM', text: `Tell me about a time you disagreed with a teammate on a technical decision${project ? ` — for example during "${project}"` : ''}. How was it resolved?`, skills: [] },
        { d: 'MEDIUM', text: `Describe a deadline you nearly missed. What went wrong, and what did you change afterwards?`, skills: [] },
        { d: 'HARD', text: `Tell me about your biggest professional failure. What was YOUR specific contribution to it, and what would you do differently?`, skills: [] },
        { d: 'HARD', text: `Describe a situation where you had to deliver results with incomplete requirements and no senior guidance. How did you decide what to build?`, skills: [] }
      ],
      aptitude: [
        { d: 'EASY', text: `You have 8 identical-looking balls; one is heavier. Using a balance scale only twice, how do you find the heavy one? Talk through your reasoning.`, skills: ['problem solving'] },
        { d: 'MEDIUM', text: `Estimate how many resumes ${company} receives per month for a ${role} opening, and explain every assumption you make.`, skills: ['estimation'] },
        { d: 'MEDIUM', text: `A process completes in 6 hours on 4 machines. Assuming perfect parallelism, how long on 9 machines — and why is perfect parallelism unrealistic?`, skills: ['quantitative reasoning'] },
        { d: 'HARD', text: `You must prioritize 10 features with only capacity for 3, and every stakeholder claims theirs is critical. Describe a defensible framework for deciding.`, skills: ['prioritization'] },
        { d: 'HARD', text: `Two candidates score identically in interviews but one has ${topSkill} experience and the other has stronger fundamentals. As the hiring manager for ${role}, whom do you hire and why?`, skills: ['judgment'] }
      ]
    };

    const order = TYPE_MIX[interviewType];
    const difficultyRank: Record<DifficultyKey, number> = { EASY: 0, MEDIUM: 1, HARD: 2 };
    const wanted = difficultyRank[difficulty];
    const used = new Set<string>();
    const plan: PlannedQuestion[] = [];

    for (let i = 0; plan.length < numQuestions && i < numQuestions * 4; i++) {
      const type = order[i % order.length];
      const pool = bank[type]
        .filter(q => !used.has(q.text))
        .sort((a, b) => Math.abs(difficultyRank[a.d] - wanted) - Math.abs(difficultyRank[b.d] - wanted));
      const pick = pool[0];
      if (!pick) continue;
      used.add(pick.text);
      plan.push({ type, difficulty: pick.d.toLowerCase(), text: pick.text, expectedSkills: pick.skills.filter(Boolean) });
    }
    return plan;
  }

  // ---------------------------------------------------------- evaluation --

  static async evaluateAnswer(
    ctx: InterviewContext,
    question: PlannedQuestion,
    transcript: string,
    durationSec: number | null
  ): Promise<AnswerEvaluation> {
    const fallback = () => this.fallbackEvaluate(question, transcript, durationSec);
    if (!geminiEnabled()) return fallback();

    try {
      const prompt = `You are a strict but fair senior interviewer for a "${ctx.job.jobTitle}" role${ctx.job.companyName ? ` at ${ctx.job.companyName}` : ''}. Evaluate the candidate's ACTUAL answer below. Score honestly on a 0-100 scale — a rambling or empty answer must score low; do not be generous.

QUESTION (${question.type}, ${question.difficulty}): "${question.text}"
EXPECTED SKILLS: ${question.expectedSkills.join(', ') || 'general'}
ANSWER TRANSCRIPT (verbatim${durationSec ? `, spoken in ${Math.round(durationSec)}s` : ''}):
"""${transcript.slice(0, 4000)}"""

Return ONLY valid JSON:
{ "technicalScore": n, "communicationScore": n, "problemSolvingScore": n, "relevanceScore": n, "completenessScore": n, "grammarScore": n, "feedback": "2-3 sentences on THIS answer", "strengths": string[], "weaknesses": string[], "suggestedBetterAnswer": "a concise model answer (3-5 sentences) the candidate could have given" }`;

      const j = await GeminiClient.generateJSON<Record<string, unknown>>(prompt, 'interview-answer-evaluation-v2');
      return {
        technicalScore: clampScore(j.technicalScore),
        communicationScore: clampScore(j.communicationScore),
        problemSolvingScore: clampScore(j.problemSolvingScore),
        relevanceScore: clampScore(j.relevanceScore),
        completenessScore: clampScore(j.completenessScore),
        grammarScore: clampScore(j.grammarScore),
        feedback: typeof j.feedback === 'string' && j.feedback.trim() ? j.feedback.trim() : 'Answer recorded and evaluated.',
        strengths: asStringArray(j.strengths, 5),
        weaknesses: asStringArray(j.weaknesses, 5),
        suggestedBetterAnswer:
          typeof j.suggestedBetterAnswer === 'string' ? j.suggestedBetterAnswer.trim() : '',
        estimated: false
      };
    } catch (err) {
      logger.error({ err }, '[INTERVIEW AI] Gemini answer evaluation failed. Serving deterministic transcript-based fallback.');
      return fallback();
    }
  }

  /**
   * Deterministic evaluation derived from the REAL transcript only: length,
   * structure, keyword coverage of expected skills, filler density. Honest
   * about being an estimate.
   */
  private static fallbackEvaluate(question: PlannedQuestion, transcript: string, durationSec: number | null): AnswerEvaluation {
    const { wordCount, fillerWordCount } = computeDeliveryMetrics(transcript, durationSec);
    const lower = transcript.toLowerCase();

    // Substance: too-short answers score poorly, ~120-250 words is the sweet spot.
    const substance =
      wordCount < 10 ? 15 : wordCount < 30 ? 40 : wordCount < 70 ? 60 : wordCount <= 300 ? 80 : 70;
    // Keyword coverage of the skills this question probes.
    const skillHits = question.expectedSkills.filter(s => lower.includes(s.toLowerCase())).length;
    const coverage = question.expectedSkills.length > 0
      ? Math.round((skillHits / question.expectedSkills.length) * 100)
      : substance;
    // Structure signals: examples, reasoning connectives, quantification.
    const structureSignals = [/for example|for instance|in my project|when i/, /because|therefore|so that|which meant/, /\d/]
      .filter(r => r.test(lower)).length;
    const structure = 45 + structureSignals * 15;
    const fillerPenalty = Math.min(20, fillerWordCount * 2);

    const technicalScore = clampScore(Math.round(substance * 0.5 + coverage * 0.5));
    const communicationScore = clampScore(structure - fillerPenalty + (wordCount >= 30 ? 10 : -10));
    const problemSolvingScore = clampScore(Math.round(structure * 0.6 + substance * 0.4) - 5);
    const relevanceScore = clampScore(coverage > 0 ? Math.max(coverage, substance - 15) : substance - 15);
    const completenessScore = clampScore(substance);
    const grammarScore = clampScore(70 - Math.min(25, fillerWordCount * 3) + (structureSignals >= 2 ? 10 : 0));

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    if (wordCount >= 70) strengths.push('Gave a substantive, developed answer.');
    if (skillHits > 0) strengths.push(`Referenced relevant skills (${question.expectedSkills.slice(0, 3).join(', ')}).`);
    if (structureSignals >= 2) strengths.push('Used examples and reasoning to structure the answer.');
    if (wordCount < 30) weaknesses.push('Answer was very short — develop your points further.');
    if (question.expectedSkills.length > 0 && skillHits === 0)
      weaknesses.push(`Did not mention the skills this question probes (${question.expectedSkills.join(', ')}).`);
    if (fillerWordCount > 4) weaknesses.push(`Frequent filler words (${fillerWordCount} detected) — pause instead of filling.`);
    if (strengths.length === 0) strengths.push('Attempted the question and stayed on topic.');
    if (weaknesses.length === 0) weaknesses.push('Add a measurable outcome to make the answer land harder.');

    return {
      technicalScore,
      communicationScore,
      problemSolvingScore,
      relevanceScore,
      completenessScore,
      grammarScore,
      feedback: `Estimated – AI unavailable. Heuristic review of your ${wordCount}-word answer: ${
        wordCount < 30 ? 'it needs significantly more depth and concrete detail.' : skillHits > 0 ? 'it touches relevant skills; tighten the structure (situation → action → result) for more impact.' : 'ground it in the specific skills the question targets and close with a concrete result.'
      }`,
      strengths,
      weaknesses,
      suggestedBetterAnswer: `A strong answer would: (1) directly address "${question.text.slice(0, 120)}", (2) ground it in a real project or experience, (3) name the specific ${question.expectedSkills.join('/') || 'relevant'} techniques used, and (4) close with a measurable result.`,
      estimated: true
    };
  }

  // ------------------------------------------------------------ adaptive --

  /**
   * Picks/creates the next question conditioned on performance so far.
   * `plannedNext` is the pre-generated plan item for this slot; Gemini may
   * replace it with an easier/harder follow-up.
   */
  static async generateAdaptiveQuestion(
    ctx: InterviewContext,
    plannedNext: PlannedQuestion,
    history: AnswerHistoryItem[]
  ): Promise<PlannedQuestion> {
    const recent = history.slice(-2);
    const rollingAvg = recent.length ? recent.reduce((s, h) => s + h.overallScore, 0) / recent.length : 60;
    const direction = rollingAvg < 50 ? 'easier' : rollingAvg > 80 ? 'harder' : 'same';

    if (!geminiEnabled() || direction === 'same') {
      return direction === 'same' ? plannedNext : this.fallbackAdapt(plannedNext, direction);
    }

    try {
      const prompt = `You are conducting a live ${ctx.job.jobTitle} interview. The last answers scored ${recent
        .map(h => h.overallScore)
        .join(', ')}/100, so make the next question ${direction} than planned while staying type "${plannedNext.type}".
Planned question: "${plannedNext.text}"
Last answer (verbatim): """${recent[recent.length - 1]?.transcript.slice(0, 1200) ?? ''}"""
${direction === 'easier' ? 'Ask a simpler, more supportive follow-up on the same topic that lets the candidate rebuild confidence.' : 'Ask a deeper, more challenging follow-up that builds directly on what they just said.'}
Return ONLY valid JSON: { "type": "${plannedNext.type}", "difficulty": "easy|medium|hard", "text": string, "expectedSkills": string[] }`;
      const j = await GeminiClient.generateJSON<PlannedQuestion>(prompt, 'interview-adaptive-question-v1');
      if (typeof j.text === 'string' && j.text.trim().length > 10) {
        return {
          type: plannedNext.type,
          difficulty: typeof j.difficulty === 'string' ? j.difficulty.toLowerCase() : plannedNext.difficulty,
          text: j.text.trim(),
          expectedSkills: asStringArray(j.expectedSkills, 6).length ? asStringArray(j.expectedSkills, 6) : plannedNext.expectedSkills
        };
      }
      return plannedNext;
    } catch (err) {
      logger.error({ err }, '[INTERVIEW AI] Adaptive question generation failed. Using planned question.');
      return this.fallbackAdapt(plannedNext, direction);
    }
  }

  private static fallbackAdapt(planned: PlannedQuestion, direction: 'easier' | 'harder'): PlannedQuestion {
    if (direction === 'easier') {
      return {
        ...planned,
        difficulty: 'easy',
        text: `Let's take this step by step: ${planned.text} Start with just the first step or the basic idea — we can build from there.`
      };
    }
    return {
      ...planned,
      difficulty: 'hard',
      text: `${planned.text} Go beyond the basics: cover edge cases, trade-offs, and how your approach behaves at scale.`
    };
  }

  // ----------------------------------------------------------- reporting --

  static async synthesizeQualitative(
    ctx: InterviewContext,
    aggregates: {
      overallScore: number;
      technicalScore: number;
      communicationScore: number;
      behavioralScore: number;
      problemSolvingScore: number;
      interviewReadiness: number;
      jobMatchPercent: number | null;
      missingSkills: string[];
    },
    perQuestion: {
      questionText: string;
      questionType: string;
      difficulty: string;
      transcript: string;
      overallScore: number;
      feedback: string;
      weaknesses: string[];
    }[]
  ): Promise<QualitativeReport> {
    const fallback = () => this.fallbackQualitative(ctx, aggregates, perQuestion);
    if (!geminiEnabled()) return fallback();

    try {
      const prompt = `You are writing the final report for a completed mock interview for "${ctx.job.jobTitle}"${ctx.job.companyName ? ` at ${ctx.job.companyName}` : ''}. Base EVERYTHING strictly on the actual results below — never invent performance the data does not show.

CANDIDATE: ${ctx.student.fullName}; goal: ${ctx.student.careerGoal ?? 'n/a'}; skills: ${ctx.student.skills.map(s => s.name).join(', ') || 'n/a'}.
COMPUTED SCORES (already final, do not change): overall ${aggregates.overallScore}, technical ${aggregates.technicalScore}, communication ${aggregates.communicationScore}, behavioral ${aggregates.behavioralScore}, problem-solving ${aggregates.problemSolvingScore}, readiness ${aggregates.interviewReadiness}${aggregates.jobMatchPercent != null ? `, job match ${aggregates.jobMatchPercent}%` : ''}.
MISSING SKILLS vs the job: ${aggregates.missingSkills.join(', ') || 'none identified'}.
PER-QUESTION RESULTS:
${perQuestion.map((q, i) => `${i + 1}. [${q.questionType}/${q.difficulty}] "${q.questionText}" → scored ${q.overallScore}/100. Feedback: ${q.feedback}. Answer excerpt: "${q.transcript.slice(0, 350)}"`).join('\n')}

Return ONLY valid JSON:
{ "aiSummary": "4-6 sentence professional narrative of how THIS interview actually went",
  "strengths": string[] (3-5, each tied to actual answers),
  "weaknesses": string[] (3-5, each tied to actual answers),
  "improvementPlan": string[] (4-6 concrete actions),
  "learningRoadmap": [ { "step": n, "title": string, "description": string, "resources": string[] } ] (4-6 ordered steps),
  "suggestedCourses": string[] (3-5 real, well-known courses),
  "recommendedProjects": string[] (2-4 portfolio project ideas targeting the weaknesses),
  "recommendedCertifications": string[] (2-3),
  "careerRecommendations": string[] (2-4 sentences of career guidance),
  "suggestedQuestions": string[] (3-5 questions to practice next) }`;

      const j = await GeminiClient.generateJSON<Record<string, unknown>>(prompt, 'interview-final-report-v2');
      const roadmapRaw = Array.isArray(j.learningRoadmap) ? j.learningRoadmap : [];
      const learningRoadmap = roadmapRaw
        .filter((r: any) => r && typeof r.title === 'string')
        .slice(0, 8)
        .map((r: any, i: number) => ({
          step: typeof r.step === 'number' ? r.step : i + 1,
          title: String(r.title),
          description: typeof r.description === 'string' ? r.description : '',
          resources: asStringArray(r.resources, 4)
        }));
      const summary = typeof j.aiSummary === 'string' && j.aiSummary.trim() ? j.aiSummary.trim() : '';
      if (!summary || learningRoadmap.length === 0) return fallback();
      return {
        aiSummary: summary,
        strengths: asStringArray(j.strengths, 6),
        weaknesses: asStringArray(j.weaknesses, 6),
        missingSkills: aggregates.missingSkills,
        improvementPlan: asStringArray(j.improvementPlan, 8),
        learningRoadmap,
        suggestedCourses: asStringArray(j.suggestedCourses, 6),
        recommendedProjects: asStringArray(j.recommendedProjects, 5),
        recommendedCertifications: asStringArray(j.recommendedCertifications, 4),
        careerRecommendations: asStringArray(j.careerRecommendations, 5),
        suggestedQuestions: asStringArray(j.suggestedQuestions, 6),
        estimated: false
      };
    } catch (err) {
      logger.error({ err }, '[INTERVIEW AI] Gemini report synthesis failed. Serving deterministic fallback.');
      return fallback();
    }
  }

  private static fallbackQualitative(
    ctx: InterviewContext,
    aggregates: {
      overallScore: number;
      technicalScore: number;
      communicationScore: number;
      behavioralScore: number;
      problemSolvingScore: number;
      interviewReadiness: number;
      jobMatchPercent: number | null;
      missingSkills: string[];
    },
    perQuestion: { questionText: string; questionType: string; overallScore: number; weaknesses: string[] }[]
  ): QualitativeReport {
    const weakest = [...perQuestion].sort((a, b) => a.overallScore - b.overallScore).slice(0, 2);
    const strongest = [...perQuestion].sort((a, b) => b.overallScore - a.overallScore).slice(0, 2);
    const weakTypes = [...new Set(weakest.map(q => q.questionType))];
    const allWeaknesses = [...new Set(perQuestion.flatMap(q => q.weaknesses))].slice(0, 5);

    return {
      estimated: true,
      aiSummary: `Estimated – AI unavailable. ${ctx.student.fullName} completed a ${perQuestion.length}-question mock interview for ${ctx.job.jobTitle}${ctx.job.companyName ? ` at ${ctx.job.companyName}` : ''}, scoring ${aggregates.overallScore}/100 overall (technical ${aggregates.technicalScore}, communication ${aggregates.communicationScore}). Strongest performance came on "${strongest[0]?.questionText.slice(0, 90) ?? 'n/a'}" (${strongest[0]?.overallScore ?? 0}/100); the biggest gap was "${weakest[0]?.questionText.slice(0, 90) ?? 'n/a'}" (${weakest[0]?.overallScore ?? 0}/100). Interview readiness is estimated at ${aggregates.interviewReadiness}/100 based on these results.`,
      strengths: strongest.map(q => `Scored ${q.overallScore}/100 on the ${q.questionType} question "${q.questionText.slice(0, 80)}…".`),
      weaknesses: allWeaknesses.length ? allWeaknesses : ['Develop answers with more concrete, quantified detail.'],
      missingSkills: aggregates.missingSkills,
      improvementPlan: [
        ...weakTypes.map(t => `Practice ${t} questions daily using the STAR structure (situation, task, action, result).`),
        'Record yourself answering and review for filler words and pacing.',
        `Prepare 3 project stories that showcase ${ctx.job.requiredSkills.slice(0, 3).join(', ') || 'the role’s core skills'}.`
      ],
      learningRoadmap: [
        { step: 1, title: 'Close the biggest skill gaps', description: `Focus on: ${aggregates.missingSkills.slice(0, 4).join(', ') || 'the skills listed in the job requirements'}.`, resources: [] },
        { step: 2, title: `Drill ${weakTypes.join(' and ') || 'weak'} question types`, description: 'Do 3 timed practice answers per day in your weakest categories.', resources: [] },
        { step: 3, title: 'Build evidence', description: 'Ship one small portfolio project that demonstrates the missing skills end to end.', resources: [] },
        { step: 4, title: 'Re-test', description: 'Retake a mock interview at the same difficulty and compare scores.', resources: [] }
      ],
      suggestedCourses: ['Effective Technical Communication', `${ctx.job.requiredSkills[0] ?? 'Core CS'} Fundamentals`, 'System Design Interview Preparation'],
      recommendedProjects: [`A portfolio project using ${ctx.job.requiredSkills.slice(0, 2).join(' and ') || 'the target stack'} that solves a real problem.`],
      recommendedCertifications: ctx.job.requiredSkills.slice(0, 2).map(s => `${s} certification (vendor or platform equivalent)`),
      careerRecommendations: [
        aggregates.overallScore >= 70
          ? `You are close to interview-ready for ${ctx.job.jobTitle} roles — start applying while you polish the gaps above.`
          : `Target the improvement plan above for 2–4 weeks before interviewing for ${ctx.job.jobTitle} roles, then re-test.`
      ],
      suggestedQuestions: weakest.map(q => q.questionText).concat(['Tell me about a time you turned negative feedback into a measurable improvement.']).slice(0, 5)
    };
  }
}
