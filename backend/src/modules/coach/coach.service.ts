import { CoachRepository } from './coach.repository';
import { CareerRepository } from '../career/career.repository';
import { GeminiClient, ChatTurn } from '../ai/gemini-client';
import { AppError } from '../../utils/app-error';
import { prisma } from '../../config/database';
import { logger } from '../../config/logger';

type CareerContext = Awaited<ReturnType<typeof CareerRepository.getCareerContext>>;
type CoachProfile = NonNullable<Awaited<ReturnType<typeof CoachRepository.getProfile>>>;

export interface StreamReplyParams {
  conversationId?: string;
  content: string;
  onMeta: (meta: { conversationId: string; title: string }) => void;
  onDelta: (text: string) => void;
}

export class CoachService {
  private static async requireProfile(userId: string): Promise<CoachProfile> {
    const profile = await CoachRepository.getProfile(userId);
    if (!profile) throw new AppError('Student profile not found.', 404, 'PROFILE_NOT_FOUND');
    return profile;
  }

  static async listConversations(userId: string) {
    const profile = await this.requireProfile(userId);
    const rows = await CoachRepository.listConversations(profile.id);
    return rows.map(r => ({
      id: r.id,
      title: r.title,
      pinned: r.pinned,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      lastMessage: r.messages[0]?.content?.slice(0, 140) ?? null,
      lastRole: r.messages[0]?.role ?? null
    }));
  }

  static async createConversation(userId: string, title?: string) {
    const profile = await this.requireProfile(userId);
    return CoachRepository.createConversation(profile.id, title?.trim() || undefined);
  }

  static async getConversation(userId: string, id: string) {
    const profile = await this.requireProfile(userId);
    const convo = await CoachRepository.getConversation(profile.id, id);
    if (!convo) throw new AppError('Conversation not found.', 404, 'NOT_FOUND');
    return convo;
  }

  static async updateConversation(userId: string, id: string, data: { title?: string; pinned?: boolean }) {
    const profile = await this.requireProfile(userId);
    const patch: { title?: string; pinned?: boolean } = {};
    if (typeof data.title === 'string' && data.title.trim()) patch.title = data.title.trim().slice(0, 120);
    if (typeof data.pinned === 'boolean') patch.pinned = data.pinned;
    if (Object.keys(patch).length === 0) throw new AppError('Nothing to update.', 400, 'VALIDATION_ERROR');
    const ok = await CoachRepository.updateConversation(profile.id, id, patch);
    if (!ok) throw new AppError('Conversation not found.', 404, 'NOT_FOUND');
    return { id, ...patch };
  }

  static async deleteConversation(userId: string, id: string) {
    const profile = await this.requireProfile(userId);
    const ok = await CoachRepository.deleteConversation(profile.id, id);
    if (!ok) throw new AppError('Conversation not found.', 404, 'NOT_FOUND');
  }

  /**
   * Core chat turn: persists the user message, streams a profile-grounded
   * assistant reply from Gemini, and persists it. Degrades to a clearly
   * labelled deterministic reply if the live model is unavailable.
   */
  static async streamReply(userId: string, params: StreamReplyParams) {
    const content = params.content?.trim();
    if (!content) throw new AppError('Message content is required.', 400, 'VALIDATION_ERROR');
    if (content.length > 4000) throw new AppError('Message is too long (max 4000 characters).', 400, 'VALIDATION_ERROR');

    const profile = await this.requireProfile(userId);

    // Resolve or create the conversation, and load prior turns for context.
    let conversationId = params.conversationId;
    let priorTurns: ChatTurn[] = [];
    let title = 'New conversation';
    if (conversationId) {
      const convo = await CoachRepository.getConversation(profile.id, conversationId);
      if (!convo) throw new AppError('Conversation not found.', 404, 'NOT_FOUND');
      title = convo.title;
      priorTurns = convo.messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', text: m.content }));
    } else {
      const created = await CoachRepository.createConversation(profile.id);
      conversationId = created.id;
      title = created.title;
    }

    // Auto-title a fresh conversation from the first user message.
    if (title === 'New conversation') {
      title = content.replace(/\s+/g, ' ').slice(0, 60) + (content.length > 60 ? '…' : '');
      await CoachRepository.setTitleIfDefault(conversationId, title);
    }

    await CoachRepository.addMessage(conversationId, 'user', content);
    params.onMeta({ conversationId, title });

    const context = await CareerRepository.getCareerContext(profile.id);
    const systemInstruction = this.buildSystemInstruction(profile, context);
    const contents: ChatTurn[] = [...priorTurns, { role: 'user', text: content }];

    let full = '';
    let estimated = false;
    const collect = (t: string) => { full += t; params.onDelta(t); };

    try {
      if (!GeminiClient.isConfigured) throw new AppError('AI not configured', 503, 'AI_NOT_CONFIGURED');
      const result = await GeminiClient.streamChat({ contents, systemInstruction, onDelta: collect });
      full = result.text;
      this.auditUsage(userId, conversationId, result.tokensIn, result.tokensOut, false);
    } catch (err) {
      logger.warn({ err }, '[COACH] Live chat unavailable; using deterministic fallback');
      estimated = true;
      if (!full) {
        const fallback = this.fallbackReply(content, profile);
        for (const chunk of fallback.match(/[^\n]*\n?|.+/g) ?? [fallback]) {
          if (chunk) params.onDelta(chunk);
        }
        full = fallback;
      }
      this.auditUsage(userId, conversationId, 0, 0, true);
    }

    const assistant = await CoachRepository.addMessage(conversationId, 'assistant', full, estimated);
    return { conversationId, messageId: assistant.id, estimated };
  }

  private static buildSystemInstruction(profile: CoachProfile, context: CareerContext): string {
    const name = `${profile.firstName} ${profile.lastName}`.trim() || 'the student';
    const skills = (context?.skills ?? []).map(s => s.skill.name);
    const resume = context?.resumes?.[0]?.resumeAnalyses?.[0];
    const interviews = (context?.mockInterviews ?? [])
      .map(mi => {
        const r = mi.reports?.[0];
        return r ? `${mi.jobTitle} (${r.score}/100)` : null;
      })
      .filter(Boolean) as string[];

    const direction = profile.careerPath || profile.preferredRole || 'still exploring options';
    const uni = profile.university?.name ? ` at ${profile.university.name}` : '';
    const grad = profile.graduationYear ? `, graduating ${profile.graduationYear}` : '';

    return [
      'You are the CareerBridge AI Career Coach — a warm, sharp, practical mentor for university students entering the job market.',
      '',
      `You are speaking with ${name}, a student${uni}${grad}.`,
      `Their target direction: ${direction}.`,
      profile.targetCompanies ? `Target companies: ${profile.targetCompanies}.` : '',
      profile.jobTypePreference ? `Looking for: ${profile.jobTypePreference} roles.` : '',
      `Current skills on record: ${skills.length ? skills.join(', ') : 'none recorded yet'}.`,
      `Resume ATS status: ${resume ? `${resume.score}/100 — ${resume.summary}` : 'no analyzed resume on file yet'}.`,
      `Recent mock interviews: ${interviews.length ? interviews.join('; ') : 'none completed yet'}.`,
      '',
      'Guidelines:',
      '- Give specific, actionable advice grounded in the real profile above. Do not invent facts about them beyond what is given; if you need more detail, ask a short question.',
      '- Be concise: a few short paragraphs or a tight bulleted list. Encourage them, but be honest about gaps.',
      '- Use GitHub-flavored Markdown (bold, bullet lists, short headings, fenced code when sharing code) for structure.',
      '- When useful, point them to CareerBridge features: Jobs & Internships, the AI Mock Interview, the Resume analyzer, and the Career Readiness report.',
      '- Stay on career, job-search, skills, interviews, and professional-growth topics.'
    ].filter(Boolean).join('\n');
  }

  private static fallbackReply(userText: string, profile: CoachProfile): string {
    const first = profile.firstName || 'there';
    return [
      `**I couldn't reach the live AI just now**, ${first} — here's some grounded guidance while it recovers.`,
      '',
      'A dependable next move for almost any career question:',
      '',
      '1. **Tighten your resume** — run it through the Resume analyzer and act on the lowest ATS sub-scores first.',
      '2. **Practice out loud** — a single AI Mock Interview surfaces the gaps fastest and lifts your readiness score.',
      '3. **Target the gap** — check your Career Readiness report for the top missing skills for your target role, and pick one to build this week.',
      '',
      '_Ask me again in a moment and I\'ll give you a tailored answer._'
    ].join('\n');
  }

  private static auditUsage(userId: string, conversationId: string, tokensIn: number, tokensOut: number, estimated: boolean) {
    prisma.auditLog
      .create({
        data: {
          userId,
          action: 'AI_USAGE',
          details: JSON.stringify({ feature: 'career-coach-chat', conversationId, tokensIn, tokensOut, estimated, provider: estimated ? 'Fallback' : 'Gemini (Production)' })
        }
      })
      .catch(err => logger.warn({ err }, '[COACH] Failed to persist chat audit log'));
  }
}
