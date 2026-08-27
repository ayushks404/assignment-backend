import express from 'express';
import { listUsers, getUserHistory, updateGoal, deleteUser, deleteUserDayLogs } from '../controllers/admin.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roles.js';

const router = express.Router();

// Apply auth protect and admin role guard to all routes in this router
router.use(protect);
router.use(requireRole('admin'));

router.get('/users', listUsers);
router.get('/users/:id/history', getUserHistory);
router.patch('/users/:id/goal', updateGoal);
router.delete('/users/:id', deleteUser);
router.delete('/users/:id/history/:date', deleteUserDayLogs);

export default router;
