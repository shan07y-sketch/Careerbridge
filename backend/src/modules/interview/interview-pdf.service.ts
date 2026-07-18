import PDFDocument from 'pdfkit';
import { MockInterview, MockInterviewReport } from '@prisma/client';

/**
 * InterviewPdfService: renders the STORED MockInterviewReport as a branded
 * PDF. It performs zero computation and zero AI calls -- the PDF is purely a
 * formatted representation of the persisted record, so the downloaded file
 * always shows exactly the same values as the dashboard, employer view and
 * university view.
 */

const BRAND = '#0f5132';
const BRAND_LIGHT = '#e7f3ec';
const INK = '#1c1f23';
const MUTED = '#5f6b76';
const RULE = '#d7dee5';

type ReportWithSession = MockInterviewReport & {
  session: MockInterview & { studentName: string };
};

interface BreakdownItem {
  questionIndex: number;
  questionType: string;
  difficulty: string | null;
  questionText: string;
  answerTranscript: string | null;
  overallScore: number;
  technicalScore: number | null;
  communicationScore: number | null;
  problemSolvingScore: number | null;
  feedback: string | null;
  strengths: string[];
  weaknesses: string[];
  suggestedBetterAnswer: string | null;
  evaluationEstimated: boolean;
}

export class InterviewPdfService {
  static render(report: ReportWithSession): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margins: { top: 54, bottom: 60, left: 50, right: 50 }, bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      try {
        this.build(doc, report);
        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  // ------------------------------------------------------------- layout --

  private static build(doc: PDFKit.PDFDocument, report: ReportWithSession) {
    const s = report.session;
    const width = doc.page.width - 100;

    // ---- header band -----------------------------------------------------
    doc.rect(0, 0, doc.page.width, 118).fill(BRAND);
    doc.fill('#ffffff').font('Helvetica-Bold').fontSize(22).text('CareerBridge', 50, 34);
    doc.font('Helvetica').fontSize(10).fillColor('#cfe5d8').text('AI Mock Interview Report', 50, 62);
    doc.fontSize(9).text(
      `Generated ${report.generatedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      50, 78
    );
    if (report.estimated) {
      doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffe08a')
        .text('Estimated – AI unavailable: parts of this evaluation used the deterministic fallback engine.', 50, 94, { width });
    }

    doc.y = 140;

    // ---- session facts ---------------------------------------------------
    const facts: [string, string][] = [
      ['Candidate', s.studentName],
      ['Role', s.jobTitle],
      ['Company', s.companyName ?? '—'],
      ['Interview type', String((s as any).interviewType ?? 'MIXED')],
      ['Difficulty', String((s as any).difficulty ?? 'MEDIUM')],
      ['Interview date', s.completedAt ? s.completedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'],
      ['Duration', s.totalDurationSec ? `${Math.max(1, Math.round(s.totalDurationSec / 60))} min` : '—'],
      ['Questions', String((report.questionBreakdown as unknown as BreakdownItem[]).length)]
    ];
    const colW = width / 4;
    facts.forEach(([label, value], i) => {
      const x = 50 + (i % 4) * colW;
      const y = doc.y + Math.floor(i / 4) * 34;
      doc.font('Helvetica').fontSize(7.5).fillColor(MUTED).text(label.toUpperCase(), x, y);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(INK).text(value, x, y + 10, { width: colW - 10 });
    });
    doc.y += Math.ceil(facts.length / 4) * 34 + 8;

    // ---- score dashboard -------------------------------------------------
    this.sectionTitle(doc, 'Performance Overview');
    const scores: [string, number | null][] = [
      ['Overall', report.score],
      ['Technical', report.technicalScore],
      ['Communication', report.communicationScore],
      ['Behavioural', report.behavioralScore],
      ['Problem Solving', report.problemSolvingScore],
      ['Confidence (est.)', report.confidenceScore],
      ['Readiness', report.interviewReadiness],
      ['Job Match', report.jobMatchPercent]
    ];
    const cardW = (width - 21) / 4;
    scores.forEach(([label, value], i) => {
      const x = 50 + (i % 4) * (cardW + 7);
      const y = doc.y + Math.floor(i / 4) * 58;
      doc.roundedRect(x, y, cardW, 50, 6).fill(BRAND_LIGHT);
      doc.font('Helvetica-Bold').fontSize(16).fillColor(BRAND)
        .text(value != null ? `${value}${label === 'Job Match' ? '%' : ''}` : '—', x, y + 9, { width: cardW, align: 'center' });
      doc.font('Helvetica').fontSize(7.5).fillColor(MUTED)
        .text(label.toUpperCase(), x, y + 32, { width: cardW, align: 'center' });
    });
    doc.y += Math.ceil(scores.length / 4) * 58 + 6;

    // ---- delivery metrics ------------------------------------------------
    doc.font('Helvetica').fontSize(9).fillColor(MUTED).text(
      `Speaking pace: ${report.speakingSpeedWpm ? `${Math.round(report.speakingSpeedWpm)} words/min` : 'n/a'}    •    Filler words: ${report.fillerWordCount ?? 0}    •    Grammar: ${report.grammarScore ?? '—'}/100    •    Skill match: ${report.skillMatchPercent != null ? `${report.skillMatchPercent}%` : 'n/a'}`,
      50, doc.y, { width }
    );
    doc.moveDown(1);

    // ---- AI summary ------------------------------------------------------
    this.sectionTitle(doc, 'AI Summary');
    this.paragraph(doc, report.aiSummary ?? report.summary, width);

    // ---- strengths & weaknesses -----------------------------------------
    this.sectionTitle(doc, 'Strengths');
    this.bullets(doc, report.strengths, width);
    this.sectionTitle(doc, 'Areas for Improvement');
    this.bullets(doc, report.weaknesses, width);

    if (report.missingSkills.length > 0) {
      this.sectionTitle(doc, 'Skill Gap Analysis');
      this.paragraph(doc, `Skills to develop for this role: ${report.missingSkills.join(', ')}.`, width);
    }

    // ---- question-by-question -------------------------------------------
    this.sectionTitle(doc, 'Question-by-Question Analysis');
    const breakdown = (report.questionBreakdown as unknown as BreakdownItem[]) ?? [];
    breakdown.forEach((q, i) => {
      this.ensureSpace(doc, 120);
      doc.roundedRect(50, doc.y, width, 20, 4).fill(BRAND_LIGHT);
      doc.font('Helvetica-Bold').fontSize(9).fillColor(BRAND)
        .text(`Q${i + 1}  [${q.questionType}${q.difficulty ? ` · ${q.difficulty}` : ''}]  —  ${q.overallScore}/100${q.evaluationEstimated ? '  (estimated)' : ''}`, 58, doc.y + 6, { width: width - 16 });
      doc.y += 26;
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(INK).text(q.questionText, 50, doc.y, { width });
      doc.moveDown(0.3);
      if (q.answerTranscript) {
        doc.font('Helvetica-Oblique').fontSize(8.5).fillColor(MUTED)
          .text(`Answer: "${q.answerTranscript.length > 500 ? `${q.answerTranscript.slice(0, 500)}…` : q.answerTranscript}"`, 50, doc.y, { width });
        doc.moveDown(0.3);
      }
      doc.font('Helvetica').fontSize(8.5).fillColor(MUTED).text(
        `Technical ${q.technicalScore ?? '—'}  ·  Communication ${q.communicationScore ?? '—'}  ·  Problem solving ${q.problemSolvingScore ?? '—'}`,
        50, doc.y, { width }
      );
      doc.moveDown(0.3);
      if (q.feedback) {
        doc.font('Helvetica').fontSize(9).fillColor(INK).text(`Feedback: ${q.feedback}`, 50, doc.y, { width });
        doc.moveDown(0.3);
      }
      if (q.suggestedBetterAnswer) {
        doc.font('Helvetica').fontSize(8.5).fillColor(MUTED).text(`Model answer: ${q.suggestedBetterAnswer}`, 50, doc.y, { width });
      }
      doc.moveDown(0.8);
      doc.moveTo(50, doc.y).lineTo(50 + width, doc.y).lineWidth(0.5).stroke(RULE);
      doc.moveDown(0.6);
    });

    // ---- camera observations --------------------------------------------
    const cam = report.cameraSummary as { event: string; count: number }[] | null;
    if (cam && cam.length > 0) {
      this.sectionTitle(doc, 'Interview Participation (Observed Events)');
      this.paragraph(
        doc,
        'The following events were observed during the session. These are factual observations only — they are not judgments about integrity.',
        width
      );
      this.bullets(doc, cam.map(c => `${c.event.replace(/_/g, ' ')}: ${c.count}×`), width);
    }

    // ---- roadmap & recommendations --------------------------------------
    this.sectionTitle(doc, 'Improvement Plan');
    this.bullets(doc, report.improvementPlan, width);

    const roadmap = (report.learningRoadmap as unknown as { step: number; title: string; description: string; resources: string[] }[]) ?? [];
    if (roadmap.length > 0) {
      this.sectionTitle(doc, 'Learning Roadmap');
      roadmap.forEach(r => {
        this.ensureSpace(doc, 46);
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor(BRAND).text(`Step ${r.step}: ${r.title}`, 50, doc.y, { width });
        doc.font('Helvetica').fontSize(9).fillColor(INK).text(r.description, 62, doc.y, { width: width - 12 });
        if (r.resources?.length) {
          doc.font('Helvetica').fontSize(8.5).fillColor(MUTED).text(`Resources: ${r.resources.join(' · ')}`, 62, doc.y, { width: width - 12 });
        }
        doc.moveDown(0.5);
      });
    }

    if (report.suggestedCourses.length > 0) {
      this.sectionTitle(doc, 'Recommended Courses');
      this.bullets(doc, report.suggestedCourses, width);
    }
    if (report.recommendedProjects.length > 0) {
      this.sectionTitle(doc, 'Recommended Projects');
      this.bullets(doc, report.recommendedProjects, width);
    }
    if (report.recommendedCertifications.length > 0) {
      this.sectionTitle(doc, 'Recommended Certifications');
      this.bullets(doc, report.recommendedCertifications, width);
    }
    if (report.careerRecommendations.length > 0) {
      this.sectionTitle(doc, 'Career Recommendations');
      this.bullets(doc, report.careerRecommendations, width);
    }
    if (report.suggestedQuestions.length > 0) {
      this.sectionTitle(doc, 'Practice These Next');
      this.bullets(doc, report.suggestedQuestions, width);
    }

    // ---- footer on every page -------------------------------------------
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.font('Helvetica').fontSize(7.5).fillColor(MUTED).text(
        `CareerBridge · AI Mock Interview Report · ${s.studentName} · Report ID ${report.id}`,
        50, doc.page.height - 40, { width, align: 'center', lineBreak: false }
      );
      doc.text(`Page ${i - range.start + 1} of ${range.count}`, 50, doc.page.height - 30, { width, align: 'center', lineBreak: false });
    }
  }

  // ------------------------------------------------------------ helpers --

  private static ensureSpace(doc: PDFKit.PDFDocument, needed: number) {
    if (doc.y + needed > doc.page.height - 70) doc.addPage();
  }

  private static sectionTitle(doc: PDFKit.PDFDocument, title: string) {
    this.ensureSpace(doc, 60);
    doc.moveDown(0.4);
    doc.font('Helvetica-Bold').fontSize(12).fillColor(BRAND).text(title, 50, doc.y);
    doc.moveTo(50, doc.y + 2).lineTo(50 + (doc.page.width - 100), doc.y + 2).lineWidth(1).stroke(BRAND_LIGHT);
    doc.moveDown(0.5);
  }

  private static paragraph(doc: PDFKit.PDFDocument, text: string, width: number) {
    doc.font('Helvetica').fontSize(9.5).fillColor(INK).text(text, 50, doc.y, { width, lineGap: 2 });
    doc.moveDown(0.5);
  }

  private static bullets(doc: PDFKit.PDFDocument, items: string[], width: number) {
    if (items.length === 0) {
      doc.font('Helvetica-Oblique').fontSize(9).fillColor(MUTED).text('None recorded.', 50, doc.y, { width });
      doc.moveDown(0.5);
      return;
    }
    items.forEach(item => {
      this.ensureSpace(doc, 28);
      doc.font('Helvetica').fontSize(9.5).fillColor(INK).text(`•  ${item}`, 56, doc.y, { width: width - 12, lineGap: 1.5 });
      doc.moveDown(0.15);
    });
    doc.moveDown(0.4);
  }
}
