/**
 * Resume text extraction: turns an uploaded PDF/DOC/DOCX buffer into plain
 * text so downstream consumers (skill extraction, AI resume analysis,
 * semantic job matching via the AI Engine) work from what the candidate
 * actually wrote instead of a filename placeholder.
 *
 * This sits in the same "deterministic interface, swappable internals" spot
 * as SkillExtractionService and AIOrchestrator's provider abstraction --
 * callers depend only on `extractText(buffer, mimeType)` returning
 * `{ text, status }`. If a future phase adds Qwen2.5-VL-based OCR for
 * scanned/image-only PDFs, only this file's internals change.
 */
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { logger } from '../../config/logger';

export type ExtractionStatus = 'PARSED' | 'FAILED';

export interface ExtractionResult {
  text: string;
  status: ExtractionStatus;
  /**
   * Why extraction failed, when it did. Surfaced to the caller because a
   * silent FAILED tells neither the student ("is my file bad?") nor an
   * operator ("is the parser broken in this environment?") anything usable -
   * and it is not diagnosable from outside the container without it.
   * Never contains file contents.
   */
  error?: string;
}

// A resume that "parses" to only a handful of characters is almost always a
// scanned image PDF with no text layer, or corrupt upload -- both should be
// treated as a parse failure rather than silently proceeding with near-empty
// text that would make AI analysis and skill extraction meaningless.
const MIN_VIABLE_TEXT_LENGTH = 40;

export class ResumeTextExtractionService {
  static async extractText(buffer: Buffer, mimeType: string): Promise<ExtractionResult> {
    try {
      let text = '';

      if (mimeType === 'application/pdf') {
        const parsed = await pdfParse(buffer);
        text = parsed.text;
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const parsed = await mammoth.extractRawText({ buffer });
        text = parsed.value;
      } else if (mimeType === 'application/msword') {
        // Legacy binary .doc has no small, well-maintained pure-JS parser
        // (mammoth only supports .docx's XML format). Rather than pull in a
        // heavier native dependency for a shrinking share of uploads, fall
        // back to skill/keyword extraction from the filename only, exactly
        // as the pre-existing placeholder behavior did -- this is a known,
        // documented gap, not a silent one.
        logger.warn('Legacy .doc text extraction is not supported; falling back to filename-based signal only.');
        return { text: '', status: 'FAILED', error: 'Legacy .doc format is not supported. Please upload a PDF or DOCX.' };
      } else {
        logger.warn({ mimeType }, 'Unrecognized resume mime type for text extraction.');
        return { text: '', status: 'FAILED', error: `Unsupported file type: ${mimeType}.` };
      }

      const normalized = text.replace(/\s+/g, ' ').trim();

      if (normalized.length < MIN_VIABLE_TEXT_LENGTH) {
        logger.warn(
          { extractedLength: normalized.length },
          'Resume text extraction produced too little text to be useful (likely a scanned/image-only document).'
        );
        return {
          text: normalized,
          status: 'FAILED',
          error: `Only ${normalized.length} characters of text were readable (minimum ${MIN_VIABLE_TEXT_LENGTH}). This is usually a scanned or image-only document.`
        };
      }

      return { text: normalized, status: 'PARSED' };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      logger.error({ err, mimeType }, 'Resume text extraction threw an error.');
      return { text: '', status: 'FAILED', error: `Could not read this file: ${reason}` };
    }
  }
}
