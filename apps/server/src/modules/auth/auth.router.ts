import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../users/user.model';
import { config } from '../../config';
import { Errors } from '../../shared/errors/AppError';
import { authenticate } from '../../shared/middleware/authenticate';
import { StudentProfile, TeacherProfile } from '../users/profile.model';

import type { Router as ExpressRouter } from "express";
const router: ExpressRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function signAccess(userId: string, role: string, email: string) {
  return jwt.sign({ userId, role, email }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry as any,
  });
}

function signRefresh(userId: string) {
  return jwt.sign({ userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry as any,
  });
}

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const body = loginSchema.parse(req.body);
  const user = await User.findOne({ email: body.email.toLowerCase() });
  if (!user) throw Errors.UNAUTHORIZED();
  if (!user.isActive) throw Errors.FORBIDDEN();

  const valid = await bcrypt.compare(body.password, user.passwordHash);
  if (!valid) throw Errors.UNAUTHORIZED();

  const accessToken = signAccess(user._id.toString(), user.role, user.email);
  const refreshToken = signRefresh(user._id.toString());

  res.json({
    data: {
      accessToken,
      refreshToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    },
  });
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw Errors.UNAUTHORIZED();
  let payload: any;
  try {
    payload = jwt.verify(refreshToken, config.jwt.refreshSecret);
  } catch {
    throw Errors.UNAUTHORIZED();
  }
  const user = await User.findById(payload.userId);
  if (!user || !user.isActive) throw Errors.UNAUTHORIZED();

  const accessToken = signAccess(user._id.toString(), user.role, user.email);
  const newRefresh = signRefresh(user._id.toString());
  res.json({ data: { accessToken, refreshToken: newRefresh } });
});

// POST /api/auth/logout  (stateless JWT — just 200 OK for now)
router.post('/logout', (_req, res) => {
  res.json({ data: { message: 'Logged out successfully.' } });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.userId).select('-passwordHash');
  if (!user) throw Errors.NOT_FOUND('User');

  let profile = null;
  if (user.role === 'STUDENT') {
    profile = await StudentProfile.findOne({ userId: user._id });
  } else if (user.role === 'TEACHER') {
    profile = await TeacherProfile.findOne({ userId: user._id });
  }

  res.json({ data: { user, profile } });
});

export default router;
