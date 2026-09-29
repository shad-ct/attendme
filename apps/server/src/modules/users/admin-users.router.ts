import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Role } from '@attendme/shared';
import { User } from './user.model';
import { StudentProfile, TeacherProfile } from './profile.model';
import { StudentSemesterMembership } from '../courses/course.model';
import { authenticate, requireRole } from '../../shared/middleware/authenticate';
import { Errors } from '../../shared/errors/AppError';

import type { Router as ExpressRouter } from "express";
const router: ExpressRouter = Router();
router.use(authenticate, requireRole(Role.ADMIN));

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum([Role.TEACHER, Role.STUDENT]),
  studentId: z.string().optional(), // required when role=STUDENT
  employeeId: z.string().optional(),
  phone: z.string().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

// GET /api/admin/users
router.get('/', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const role = req.query.role as string;
  const search = req.query.search as string;

  const filter: Record<string, unknown> = {};
  if (role && Object.values(Role).includes(role as Role)) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-passwordHash')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  // Append extra info depending on role
  const usersWithDetails = await Promise.all(
    users.map(async (user) => {
      const u = user.toObject();
      if (u.role === Role.STUDENT) {
        const profile = await StudentProfile.findOne({ userId: u._id });
        const membership = await StudentSemesterMembership.findOne({ studentId: u._id, isCurrent: true })
          .populate({
            path: 'semesterId',
            populate: { path: 'courseId' }
          });
        const semDoc = membership?.semesterId as any;
        return {
          ...u,
          studentId: profile?.studentId,
          className: semDoc?.name, // Use className to represent the semester name on the frontend without breaking it
          courseName: semDoc?.courseId?.name,
        };
      } else if (u.role === Role.TEACHER) {
        const profile = await TeacherProfile.findOne({ userId: u._id });
        const Paper = mongoose.model('Paper');
        const assignments = await Paper.find({ teacherId: u._id });
        const subjects = assignments
          .map(a => a.name)
          .filter(Boolean);
        return {
          ...u,
          employeeId: profile?.employeeId,
          teachingSubjects: subjects.length > 0 ? subjects.join(', ') : 'None',
        };
      }
      return u;
    })
  );

  res.json({
    data: usersWithDetails,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// POST /api/admin/users
router.post('/', async (req: Request, res: Response) => {
  const body = createUserSchema.parse(req.body);

  if (body.role === Role.STUDENT && !body.studentId) {
    throw Errors.VALIDATION('studentId is required for students.');
  }

  const existing = await User.findOne({ email: body.email.toLowerCase() });
  if (existing) throw Errors.CONFLICT('A user with this email already exists.');

  const passwordHash = await bcrypt.hash(body.password, 12);
  const user = await User.create({
    name: body.name,
    email: body.email.toLowerCase(),
    passwordHash,
    role: body.role,
  });

  if (body.role === Role.STUDENT) {
    await StudentProfile.create({ userId: user._id, studentId: body.studentId!, phone: body.phone });
  } else if (body.role === Role.TEACHER) {
    await TeacherProfile.create({ userId: user._id, employeeId: body.employeeId, phone: body.phone });
  }

  const { passwordHash: _h, ...userData } = user.toObject();
  res.status(201).json({ data: userData });
});

// PATCH /api/admin/users/:id
router.patch('/:id', async (req: Request, res: Response) => {
  const body = updateUserSchema.parse(req.body);
  const user = await User.findByIdAndUpdate(req.params.id, body, { new: true }).select('-passwordHash');
  if (!user) throw Errors.NOT_FOUND('User');
  res.json({ data: user });
});

// PATCH /api/admin/users/:id/status
router.patch('/:id/status', async (req: Request, res: Response) => {
  const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);
  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true }).select('-passwordHash');
  if (!user) throw Errors.NOT_FOUND('User');
  res.json({ data: user });
});

export default router;
