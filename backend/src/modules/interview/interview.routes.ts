import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { InterviewController } from './interview.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { AppError } from '../../utils/app-error';

const router = Router();

// Answer clips: short audio (required) + optional video. Generous limit
// relative to resume uploads since these are AV recordings, but still
// bounded -- MAX_ANSWER_CLIP_SECONDS on the AI Engine side additionally
// caps how much of an oversized clip actually gets analyzed.
const upload = multer({
  limits: { fileSize: 60 * 1024 * 1024, files: 2 }, // 60 MB per file
  fileFilter: (req, file, cb) => {
    const allowedAudioMimeTypes = ['audio/webm', 'audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/ogg'];
    const allowedVideoMimeTypes = ['video/webm', 'video/mp4', 'video/quicktime'];

    if (file.fieldname === 'audio' && !allowedAudioMimeTypes.includes(file.mimetype)) {
      return cb(new AppError('Unsupported audio format.', 400, 'INVALID_FILE_TYPE') as any);
    }
    if (file.fieldname === 'video' && !allowedVideoMimeTypes.includes(file.mimetype)) {
      return cb(new AppError('Unsupported video format.', 400, 'INVALID_FILE_TYPE') as any);
    }

    const sanitizedName = path.basename(file.originalname).replace(/[^a-zA-Z0-9.\-_]/g, '_');
    file.originalname = sanitizedName;

    cb(null, true);
  }
});

router.use(authenticate);

router.get('/', InterviewController.getHistory);
router.get('/:id', InterviewController.getSessionDetail);
router.get('/:id/report/pdf', InterviewController.downloadReportPdf);

router.post('/start', InterviewController.startInterview);
router.post(
  '/:id/answer',
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]),
  InterviewController.submitAnswer
);
router.post('/:id/observation', InterviewController.addObservation);
router.post('/:id/end', InterviewController.endInterview);
router.patch('/:id/share', InterviewController.setSharing);

export default router;
