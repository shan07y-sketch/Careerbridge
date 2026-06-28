import { Response } from 'express';
import { ProfileService } from './profile.service';
import { catchAsync } from '../../utils/catch-async';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';

export class ProfileController {
  static getProfile = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const profile = await ProfileService.getStudentProfile(req.user!.id);
    res.status(200).json({
      success: true,
      data: profile,
      message: 'Student profile retrieved.'
    });
  });

  static updateProfile = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const profile = await ProfileService.updateStudentProfile(req.user!.id, req.body);
    res.status(200).json({
      success: true,
      data: profile,
      message: 'Profile updated successfully.'
    });
  });

  static addEducation = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const item = await ProfileService.addEducation(req.user!.id, req.body);
    res.status(201).json({
      success: true,
      data: item,
      message: 'Education history record added.'
    });
  });

  static addExperience = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const item = await ProfileService.addExperience(req.user!.id, req.body);
    res.status(201).json({
      success: true,
      data: item,
      message: 'Work experience record added.'
    });
  });

  static addProject = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const item = await ProfileService.addProject(req.user!.id, req.body);
    res.status(201).json({
      success: true,
      data: item,
      message: 'Key project record added.'
    });
  });

  static addSkill = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const item = await ProfileService.addSkill(req.user!.id, req.body);
    res.status(201).json({
      success: true,
      data: item,
      message: 'Skill competency registered.'
    });
  });

  static addCertification = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const item = await ProfileService.addCertification(req.user!.id, req.body);
    res.status(201).json({
      success: true,
      data: item,
      message: 'Certification record registered.'
    });
  });
}
