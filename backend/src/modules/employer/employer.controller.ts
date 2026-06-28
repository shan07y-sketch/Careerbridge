import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { catchAsync } from '../../utils/catch-async';
import { EmployerService } from './employer.service';
import { EmployerRequest } from './employer.types';
import { AppError } from '../../utils/app-error';
import { prisma } from '../../config/database';
import { ApplicationStatus } from '@prisma/client';

export class EmployerController {
  static getDashboard = catchAsync(async (req: EmployerRequest, res: Response) => {
    const data = await EmployerService.getDashboard(req.user!.id);
    res.status(200).json({ success: true, data });
  });

  static getCompanyProfile = catchAsync(async (req: EmployerRequest, res: Response) => {
    const data = await EmployerService.getCompanyProfile(req.user!.id);
    res.status(200).json({ success: true, data });
  });

  static updateCompanyProfile = catchAsync(async (req: EmployerRequest, res: Response) => {
    const data = await EmployerService.updateCompanyProfile(req.user!.id, req.body);
    res.status(200).json({ success: true, data, message: 'Company profile updated successfully.' });
  });

  static getRecruiters = catchAsync(async (req: EmployerRequest, res: Response) => {
    const data = await EmployerService.getRecruiters(req.user!.id);
    res.status(200).json({ success: true, data });
  });

  static inviteRecruiter = catchAsync(async (req: EmployerRequest, res: Response) => {
    const data = await EmployerService.inviteRecruiter(req.user!.id, req.body.email);
    res.status(200).json({ success: true, data, message: 'Invitation email logged successfully.' });
  });

  static createJob = catchAsync(async (req: EmployerRequest, res: Response) => {
    const data = await EmployerService.createJob(req.user!.id, req.body.categoryId, req.body);
    res.status(201).json({ success: true, data, message: 'Job posting generated.' });
  });

  static updateJob = catchAsync(async (req: EmployerRequest, res: Response) => {
    const data = await EmployerService.updateJob(req.user!.id, req.params.id, req.body);
    res.status(200).json({ success: true, data, message: 'Job details updated.' });
  });

  static getJobs = catchAsync(async (req: EmployerRequest, res: Response) => {
    const data = await EmployerService.getJobs(req.user!.id);
    res.status(200).json({ success: true, data });
  });

  static getApplications = catchAsync(async (req: EmployerRequest, res: Response) => {
    const data = await EmployerService.getApplications(req.user!.id);
    res.status(200).json({ success: true, data });
  });

  static updateApplicationStage = catchAsync(async (req: EmployerRequest, res: Response) => {
    const data = await EmployerService.updateApplicationStage(
      req.user!.id,
      req.params.id,
      req.body.stageName,
      req.body.status as ApplicationStatus,
      req.body.notes
    );
    res.status(200).json({ success: true, data, message: 'Candidate pipeline stage updated.' });
  });

  static getAnalytics = catchAsync(async (req: EmployerRequest, res: Response) => {
    const data = await EmployerService.getAnalytics(req.user!.id);
    res.status(200).json({ success: true, data });
  });

  static previewResume = catchAsync(async (req: EmployerRequest, res: Response) => {
    const resume = await prisma.resume.findUnique({
      where: { id: req.params.id }
    });

    if (!resume) {
      throw new AppError('Resume metadata not found.', 404, 'RESUME_NOT_FOUND');
    }

    // Resolve relative path under backend/uploads
    const storagePath = resume.fileUrl.split('/uploads/')[1];
    if (!storagePath) {
      throw new AppError('Resume file path not mapped.', 404, 'PATH_NOT_MAPPED');
    }

    const absolutePath = path.resolve(process.cwd(), 'uploads', storagePath);
    if (!fs.existsSync(absolutePath)) {
      throw new AppError('Physical resume file not found.', 404, 'FILE_NOT_FOUND');
    }

    // Return the preview file streamed
    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(absolutePath);
  });
}
