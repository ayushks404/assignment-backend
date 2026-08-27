import express from 'express';
import { logIntake, getTodayIntake } from '../controllers/intake.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, logIntake);
router.get('/today', protect, getTodayIntake);

export default router;
