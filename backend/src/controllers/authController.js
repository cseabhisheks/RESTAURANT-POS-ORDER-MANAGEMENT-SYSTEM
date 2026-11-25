import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  if (typeof email !== 'string' || !email.trim()) {
    throw new AppError('Email is required.', 400);
  }
  if (typeof password !== 'string' || !password) {
    throw new AppError('Password is required.', 400);
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');
  if (!user || !user.isActive) {
    throw new AppError('Invalid email or password.', 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401);
  }

  const token = jwt.sign(
    { sub: user._id.toString(), role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});
