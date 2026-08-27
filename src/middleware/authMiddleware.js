import { body, validationResult } from 'express-validator';

export const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required'),

  body('email')
    .trim()
    .normalizeEmail()
    .isEmail().withMessage('Please provide a valid email'),

  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

export const loginRules = [
  body('email')
    .trim()
    .normalizeEmail()
    .isEmail().withMessage('Please provide a valid email'),

  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

export const validate = (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: result.array().map(e => ({ field: e.path, msg: e.msg })),
    });
  }
  next();
};