import { Response } from 'express';
import { CoachService } from './coach.service';
import { catchAsync } from '../../utils/catch-async';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../utils/app-error';
import { logger } from '../../config/logger';

export class CoachController {
  static listConversations = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await CoachService.listConversations(req.user!.id);
    res.status(200).json({ success: true, data, message: 'Conversations retrieved.' });
  });

  static createConversation = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { title } = req.body as { title?: string };
    const data = await CoachService.createConversation(req.user!.id, title);
    res.status(201).json({ success: true, data, message: 'Conversation created.' });
  });

  static getConversation = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const data = await CoachService.getConversation(req.user!.id, req.params.id);
    res.status(200).json({ success: true, data, message: 'Conversation retrieved.' });
  });

  static updateConversation = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { title, pinned } = req.body as { title?: string; pinned?: boolean };
    const data = await CoachService.updateConversation(req.user!.id, req.params.id, { title, pinned });
    res.status(200).json({ success: true, data, message: 'Conversation updated.' });
  });

  static deleteConversation = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    await CoachService.deleteConversation(req.user!.id, req.params.id);
    res.status(200).json({ success: true, data: null, message: 'Conversation deleted.' });
  });

  /**
   * Server-Sent Events chat stream. Not wrapped in catchAsync: once the SSE
   * headers are sent we must report errors as an SSE `error` event and end the
   * stream ourselves rather than let the global JSON error handler run.
   */
  static async streamChat(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { conversationId, content } = req.body as { conversationId?: string; content?: string };

    // `no-transform` makes the global compression middleware skip this response
    // so deltas flush immediately instead of being buffered.
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const result = await CoachService.streamReply(req.user!.id, {
        conversationId,
        content: content ?? '',
        onMeta: meta => send('meta', meta),
        onDelta: text => send('delta', { text })
      });
      send('done', result);
    } catch (err) {
      logger.warn({ err }, '[COACH] Stream chat failed');
      const message = err instanceof AppError ? err.message : 'The coach could not respond right now.';
      send('error', { message });
    } finally {
      res.end();
    }
  }
}
