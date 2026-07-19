import { Router } from 'express';
import { CoverLetterController } from './cover-letter.controller';
import { authenticate, restrictTo } from '../../middlewares/auth.middleware';

const router = Router();

// Every route here reads or writes a StudentProfile-owned draft, and generate
// makes a real billed Gemini call - so the whole module is student-only.
router.use(authenticate);
router.use(restrictTo('student'));

router.get('/', CoverLetterController.list);
router.post('/generate', CoverLetterController.generate);
router.get('/:id', CoverLetterController.getById);
router.delete('/:id', CoverLetterController.remove);

export default router;
