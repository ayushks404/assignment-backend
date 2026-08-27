import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';

export const register = async (req, res) => {
  const { name, email, password } = req.body;

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
