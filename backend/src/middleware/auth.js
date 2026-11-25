import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from './asyncHandler.js';

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AppError('Authentication required. Please log in.', 401);
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new AppError('Invalid or expired authentication token.', 401);
  }

  const user = await User.findById(payload.sub).select('name email role isActive');
  if (!user || !user.isActive) {
    throw new AppError('User account is inactive or no longer exists.', 401);
  }

  req.user = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };

  next();
});

export function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. This action requires ${allowedRoles.join(' or ')} privileges.`,
          403
        )
      );
    }
    return next();
  };
}

