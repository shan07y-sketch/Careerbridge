import { Router } from 'express';
import { ResumeController } from './resume.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import multer from 'multer';

import path from 'path';
import { AppError } from '../../utils/app-error';

const router = Router();

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    // 1. MIME Validation
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new AppError('Only PDF, DOC, or DOCX documents are allowed.', 400, 'INVALID_FILE_TYPE') as any);
    }

    // 2. Extension Validation
    const extension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    if (!allowedExtensions.includes(extension)) {
      return cb(new AppError('Only PDF, DOC, or DOCX documents are allowed.', 400, 'INVALID_FILE_TYPE') as any);
    }

    // 3. Filename path sanitization to prevent traversal exploits
    const sanitizedName = path.basename(file.originalname).replace(/[^a-zA-Z0-9.\-_]/g, '_');
    file.originalname = sanitizedName;

    cb(null, true);
  }
});

router.use(authenticate);

// Version history ("My Resumes") and single-version detail.
router.get('/', ResumeController.getResumeHistory);
router.get('/:id', ResumeController.getResumeDetail);

// Upload = new version (see ResumeService.uploadResume for the rotation logic).
router.post('/upload', upload.single('resume'), ResumeController.uploadResume);
router.delete('/:id', ResumeController.deleteResume);

// Owner-only secure download.
router.get('/:id/download', ResumeController.downloadResume);

// Secure sharing: create/revoke a time-limited public link.
router.post('/:id/share', ResumeController.createShareLink);
router.delete('/:id/share', ResumeController.revokeShareLink);

export default router;
