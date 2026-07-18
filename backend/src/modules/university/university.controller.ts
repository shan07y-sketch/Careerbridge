import { Response } from 'express';
import { catchAsync } from '../../utils/catch-async';
import { UniversityService } from './university.service';
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
      req.user!.id,
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

  static assessStudentPlacement = catchAsync(async (req: UniversityRequest, res: Response) => {
    const data = await UniversityService.assessStudentPlacement(req.user!.id, req.universityId!, req.params.studentId);
    res.status(201).json({ success: true, data, message: 'Placement prediction generated.' });
  });

  static getLatestStudentInsight = catchAsync(async (req: UniversityRequest, res: Response) => {
    const data = await UniversityService.getLatestStudentInsight(req.universityId!, req.params.studentId);
    res.status(200).json({ success: true, data });
  });

  static generateDepartmentInsight = catchAsync(async (req: UniversityRequest, res: Response) => {
    const data = await UniversityService.generateDepartmentInsight(req.user!.id, req.universityId!);
    res.status(201).json({ success: true, data, message: 'Department analytics insight generated.' });
  });

  static recommendCampusDrives = catchAsync(async (req: UniversityRequest, res: Response) => {
    const data = await UniversityService.recommendCampusDrives(req.user!.id, req.universityId!);
    res.status(201).json({ success: true, data, message: 'Campus drive recommendations generated.' });
  });

  static generatePlacementReport = catchAsync(async (req: UniversityRequest, res: Response) => {
    const data = await UniversityService.generatePlacementReport(req.user!.id, req.universityId!);
    res.status(201).json({ success: true, data, message: 'Placement report generated.' });
  });

  static getCampusDrives = catchAsync(async (req: UniversityRequest, res: Response) => {
    const data = await UniversityService.getDrives(req.universityId!);
    res.status(200).json({ success: true, data });
  });

  static createCampusDrive = catchAsync(async (req: UniversityRequest, res: Response) => {
    const data = await UniversityService.createDrive(req.user!.id, req.universityId!, req.body);
    res.status(201).json({ success: true, data, message: 'Campus drive created.' });
  });

  static updateCampusDrive = catchAsync(async (req: UniversityRequest, res: Response) => {
    const data = await UniversityService.updateDrive(req.user!.id, req.universityId!, req.params.id, req.body);
    res.status(200).json({ success: true, data, message: 'Campus drive updated.' });
  });

  static deleteCampusDrive = catchAsync(async (req: UniversityRequest, res: Response) => {
    const data = await UniversityService.deleteDrive(req.user!.id, req.universityId!, req.params.id);
    res.status(200).json({ success: true, data, message: 'Campus drive deleted.' });
  });

  static getCompanies = catchAsync(async (req: UniversityRequest, res: Response) => {
    const data = await UniversityService.getPartnerCompanies(req.universityId!);
    res.status(200).json({ success: true, data });
  });

  static getSettings = catchAsync(async (req: UniversityRequest, res: Response) => {
    const data = await UniversityService.getSettings(req.universityId!);
    res.status(200).json({ success: true, data });
  });

  static updateSettings = catchAsync(async (req: UniversityRequest, res: Response) => {
    const data = await UniversityService.updateSettings(req.user!.id, req.universityId!, req.body);
    res.status(200).json({ success: true, data, message: 'University settings updated.' });
  });

  static sendBroadcast = catchAsync(async (req: UniversityRequest, res: Response) => {
    const { recipientUserIds, title, content } = req.body;
    const data = await UniversityService.sendBroadcast(req.user!.id, req.universityId!, recipientUserIds, title, content);
    res.status(201).json({ success: true, data, message: 'Message sent.' });
  });

  static getSentBroadcasts = catchAsync(async (req: UniversityRequest, res: Response) => {
    const data = await UniversityService.getSentBroadcasts(req.user!.id);
    res.status(200).json({ success: true, data });
  });

  static submitSupportRequest = catchAsync(async (req: UniversityRequest, res: Response) => {
    const { subject, message } = req.body;
    const data = await UniversityService.submitSupportRequest(req.user!.id, subject, message);
    res.status(201).json({ success: true, data, message: 'Support request submitted.' });
  });
}
