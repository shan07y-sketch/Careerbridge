import { Response } from 'express';
import { catchAsync } from '../../utils/catch-async';
import { UniversityService } from './university.service';
import { CampusDriveService } from './campus-drive.service';
import { UniversityRequest } from './university.types';

export class UniversityController {
  static getDashboard = catchAsync(async (req: UniversityRequest, res: Response) => {
    const data = await UniversityService.getDashboard(req.universityId!);
    res.status(200).json({ success: true, data });
  });

  static getStudents = catchAsync(async (req: UniversityRequest, res: Response) => {
    const data = await UniversityService.getStudents(req.universityId!);
    res.status(200).json({ success: true, data });
  });

  static verifyStudent = catchAsync(async (req: UniversityRequest, res: Response) => {
    const data = await UniversityService.verifyStudent(
      req.universityId!,
      req.params.studentId,
      req.body.status
    );
    res.status(200).json({ success: true, data, message: 'Student verification status updated.' });
  });

  static getAnalytics = catchAsync(async (req: UniversityRequest, res: Response) => {
    const data = await UniversityService.getAnalytics(req.universityId!);
    res.status(200).json({ success: true, data });
  });

  static getAIInsights = catchAsync(async (req: UniversityRequest, res: Response) => {
    const data = await UniversityService.getAIPlacementInsights(req.universityId!);
    res.status(200).json({ success: true, data });
  });

  static getCampusDrives = catchAsync(async (req: UniversityRequest, res: Response) => {
    const data = await CampusDriveService.getDrives(req.universityId!);
    res.status(200).json({ success: true, data });
  });

  static createCampusDrive = catchAsync(async (req: UniversityRequest, res: Response) => {
    const data = await CampusDriveService.createDrive(req.universityId!, req.body);
    res.status(201).json({ success: true, data, message: 'Campus drive drive created.' });
  });

  static updateCampusDrive = catchAsync(async (req: UniversityRequest, res: Response) => {
    const data = await CampusDriveService.updateDrive(req.universityId!, req.params.id, req.body);
    res.status(200).json({ success: true, data, message: 'Campus drive drive updated.' });
  });
}
