import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const register = async (req, res) => {
  const { name, email, password } = req.body || {};

  // Input validation
  const errors = [];
  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push({ field: 'name', msg: 'Name is required' });
  }
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push({ field: 'email', msg: 'Please provide a valid email' });
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push({ field: 'password', msg: 'Password must be at least 6 characters long' });
  }
  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  try {
    // Check if email already registered
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Create new user (forcing role: 'user' as per spec)
    const user = new User({
      name: name,
      email: email,
      password: password,
      role: 'user'
    });

    await user.save();

    // Sign JWT token
    const token = signToken({ id: user._id, role: user.role });

    // Return 201 response with token and user details (excluding password)
    return res.status(201).json({
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body || {};

  // Input validation
  const errors = [];
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push({ field: 'email', msg: 'Please provide a valid email' });
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push({ field: 'password', msg: 'Password must be at least 6 characters long' });
  }
  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  try {
    // Select user by email and explicitly include password field
    const user = await User.findOne({ email: email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if password is correct
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = signToken({ id: user._id, role: user.role });

    return res.status(200).json({
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};
