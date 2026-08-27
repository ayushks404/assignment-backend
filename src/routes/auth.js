import express from 'express';
import { register, login } from '../controllers/auth.js';
import { registerRules, loginRules, validate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);

export default router;

  
