import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Role } from '@attendme/shared';
import { Course, Semester, StudentSemesterMembership } from './course.model';
import { StudentProfile } from '../users/profile.model';
import { authenticate, requireRole } from '../../shared/middleware/authenticate';
import { Errors } from '../../shared/errors/AppError';

import type { Router as ExpressRouter } from "express";
const router: ExpressRouter = Router();
router.use(authenticate, requireRole(Role.ADMIN));

// ── Courses ──────────────────────────────────────────────────────────────────

router.get('/courses', async (_req, res) => {
  const courses = await Course.find().sort({ name: 1 });
  res.json({ data: courses });
});

router.post('/courses', async (req, res) => {
  const body = z.object({
    name: z.string().min(1),
    code: z.string().optional(),
    description: z.string().optional(),
  }).parse(req.body);
  const course = await Course.create(body);
  res.status(201).json({ data: course });
});

router.patch('/courses/:id', async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!course) throw Errors.NOT_FOUND('Course');
  res.json({ data: course });
});

router.delete('/courses/:id', async (req, res) => {
  await Course.findByIdAndDelete(req.params.id);
  res.json({ data: { message: 'Course deleted.' } });
});

// ── Semesters ─────────────────────────────────────────────────────────────────

router.get('/semesters', async (req, res) => {
  const courseId = req.query.courseId as string;
  const filter = courseId ? { courseId } : {};
  const sems = await Semester.find(filter).populate('courseId', 'name code').sort({ sequence: 1 });
  res.json({ data: sems });
});

router.post('/semesters', async (req, res) => {
  const body = z.object({
    courseId: z.string(),
    name: z.string().min(1),
    academicYear: z.string(),
    sequence: z.number(),
  }).parse(req.body);
  const sem = await Semester.create(body);
  res.status(201).json({ data: sem });
});

router.patch('/semesters/:id', async (req, res) => {
  const sem = await Semester.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!sem) throw Errors.NOT_FOUND('Semester');
  res.json({ data: sem });
});

router.delete('/semesters/:id', async (req, res) => {
  await Semester.findByIdAndDelete(req.params.id);
  res.json({ data: { message: 'Semester deleted.' } });
});

// GET /api/admin/semesters/:id/students
router.get('/semesters/:id/students', async (req, res) => {
  const memberships = await StudentSemesterMembership.find({ semesterId: req.params.id, isCurrent: true })
    .populate({ path: 'studentId', select: 'name email' });
  res.json({ data: memberships });
});

// POST /api/admin/semesters/:id/students  — assign student
router.post('/semesters/:id/students', async (req, res) => {
  const { studentId } = z.object({ studentId: z.string() }).parse(req.body);

  // Remove from previous semester
  await StudentSemesterMembership.updateMany(
    { studentId, isCurrent: true },
    { isCurrent: false, endDate: new Date() }
  );

  const membership = await StudentSemesterMembership.create({
    studentId,
    semesterId: req.params.id,
    startDate: new Date(),
    isCurrent: true,
  });

  // Update StudentProfile.currentSemesterId
  await StudentProfile.findOneAndUpdate({ userId: studentId }, { currentSemesterId: req.params.id });

  res.status(201).json({ data: membership });
});

// DELETE /api/admin/semesters/:id/students/:studentId
router.delete('/semesters/:id/students/:studentId', async (req, res) => {
  await StudentSemesterMembership.findOneAndUpdate(
    { semesterId: req.params.id, studentId: req.params.studentId, isCurrent: true },
    { isCurrent: false, endDate: new Date() }
  );
  await StudentProfile.findOneAndUpdate({ userId: req.params.studentId }, { $unset: { currentSemesterId: '' } });
  res.json({ data: { message: 'Student removed from semester.' } });
});

export default router;
