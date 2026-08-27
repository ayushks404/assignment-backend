import express from 'express';
import { listUsers, getUserHistory } from '../controllers/admin.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roles.js';

const router = express.Router();

// Apply auth protect and admin role guard to all routes in this router
router.use(protect);
router.use(requireRole('admin'));

router.get('/users', listUsers);
router.get('/users/:id/history', getUserHistory);

export default router;
