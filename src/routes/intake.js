import express from 'express';
import { logIntake, getTodayIntake, getIntakeHistory, deleteIntake } from '../controllers/intake.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, logIntake);
router.get('/today', protect, getTodayIntake);
router.get('/history', protect, getIntakeHistory);
router.delete('/:id', protect, deleteIntake);

export default router;
