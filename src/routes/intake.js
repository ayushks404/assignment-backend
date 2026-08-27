import express from 'express';
import { logIntake } from '../controllers/intake.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, logIntake);

export default router;
