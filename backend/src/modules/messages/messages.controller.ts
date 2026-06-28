import { Response } from 'express';
import { MessagesService } from './messages.service';
import { catchAsync } from '../../utils/catch-async';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';

export class MessagesController {
  static getConversations = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const list = await MessagesService.getConversations(req.user!.id);
    res.status(200).json({
      success: true,
      data: list,
      message: 'Conversations list retrieved.'
    });
  });

  static getMessages = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const list = await MessagesService.getMessages(req.user!.id, req.params.conversationId);
    res.status(200).json({
      success: true,
      data: list,
      message: 'Messages list retrieved.'
    });
  });

  static sendMessage = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const message = await MessagesService.sendMessage(req.user!.id, req.params.conversationId, req.body.content);
    res.status(201).json({
      success: true,
      data: message,
      message: 'Message sent successfully.'
    });
  });

  static startConversation = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const conv = await MessagesService.startConversation(req.user!.id, req.body.recipientProfileId);
    res.status(201).json({
      success: true,
      data: conv,
      message: 'Conversation channel initialized.'
    });
  });
}
