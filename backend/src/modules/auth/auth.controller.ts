import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { catchAsync } from '../../utils/catch-async';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { AppError } from '../../utils/app-error';

export class AuthController {
  static register = catchAsync(async (req: Request, res: Response) => {
    const user = await AuthService.register(req.body);
    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      message: 'Registration successful! Verification instructions have been sent to your email.'
    });
  });

  static login = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.login(req.body);

    // Cookie parameters mapping HttpOnly token
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days duration
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user
      },
      message: 'Login successful.'
    });
  });

  static refresh = catchAsync(async (req: Request, res: Response) => {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (!token) {
      throw new AppError('Refresh token is required.', 400, 'REFRESH_TOKEN_REQUIRED');
    }

    const result = await AuthService.refresh(token);

    // Rotation: the old refresh token cookie is replaced with the newly
    // minted one so the retired token can never be used again by anyone
    // holding a copy of it (see AuthService.refresh for the full rationale).
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken
      },
      message: 'Access token renewed successfully.'
    });
  });

  static logout = catchAsync(async (req: Request, res: Response) => {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (token) {
      await AuthService.logout(token);
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    res.status(200).json({
      success: true,
      data: {},
      message: 'Logout successful.'
    });
  });

  static forgotPassword = catchAsync(async (req: Request, res: Response) => {
    await AuthService.forgotPassword(req.body.email);
    res.status(200).json({
      success: true,
      data: {},
      message: 'If the email exists, a password reset link has been dispatched.'
    });
  });

  static resetPassword = catchAsync(async (req: Request, res: Response) => {
    await AuthService.resetPassword(req.body);
    res.status(200).json({
      success: true,
      data: {},
      message: 'Password has been reset successfully.'
    });
  });

  static verifyEmail = catchAsync(async (req: Request, res: Response) => {
    const token = req.query.token as string;
    await AuthService.verifyEmail(token);
    res.status(200).json({
      success: true,
      data: {},
      message: 'Email address has been verified successfully!'
    });
  });

  static resendVerification = catchAsync(async (req: Request, res: Response) => {
    await AuthService.resendVerification(req.body.email);
    res.status(200).json({
      success: true,
      data: {},
      message: 'Verification link has been resent successfully.'
    });
  });

  static me = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Unauthorized access.', 401, 'UNAUTHORIZED');
    }
    const user = await AuthRepository.findUserById(req.user.id);
    res.status(200).json({
      success: true,
      data: {
        user
      },
      message: 'Current authenticated session summary retrieved.'
    });
  });

  static check = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const isAuthenticated = !!req.user;
    res.status(200).json({
      success: true,
      data: {
        isAuthenticated,
        user: req.user ? { id: req.user.id, email: req.user.email } : null,
        role: req.user ? req.user.role : null
      },
      message: 'Authentication check completed.'
    });
  });

  static changePassword = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Unauthorized access.', 401, 'UNAUTHORIZED');
    }
    await AuthService.changePassword(req.user.id, req.body);
    res.status(200).json({
      success: true,
      data: {},
      message: 'Your password has been changed successfully.'
    });
  });
}
