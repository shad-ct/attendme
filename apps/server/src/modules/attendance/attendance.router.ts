import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Role, AttendanceStatus } from '@attendme/shared';
import { ClassSession } from '../timetable/timetable.model';
import { AttendanceRecord } from './attendance.model';
import { StudentSemesterMembership } from '../courses/course.model';
import { authenticate, requireRole } from '../../shared/middleware/authenticate';
import { Errors } from '../../shared/errors/AppError';
import { ensureTodaySessions } from '../timetable/timetable.router';

import type { Router as ExpressRouter } from "express";
const router: ExpressRouter = Router();
router.use(authenticate);

// ── Teacher ───────────────────────────────────────────────────────────────────

// GET /api/attendance/admin/sessions  — Admin: list sessions across all classes
router.get('/admin/sessions', requireRole(Role.ADMIN), async (req: Request, res: Response) => {
  const semesterId = req.query.semesterId as string;
  const date = req.query.date as string;

  const filter: Record<string, unknown> = {};
  if (semesterId) filter.semesterId = semesterId;
  if (date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    filter.date = { $gte: d, $lt: next };
  }

  const sessions = await ClassSession.find(filter)
    .populate('paperId', 'name code')
    .populate('semesterId', 'name academicYear')
    .populate('teacherId', 'name')
    .sort({ date: -1, startTime: 1 })
    .limit(100);

  const result = await Promise.all(
    sessions.map(async (s) => {
      const records = await AttendanceRecord.find({ classSessionId: s._id });
      const present = records.filter((r) => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.LATE).length;
      return { ...s.toObject(), attendanceSummary: { present, total: records.length } };
    })
  );

  res.json({ data: result });
});

// GET /api/attendance/sessions/today
router.get('/sessions/today', requireRole(Role.TEACHER, Role.ADMIN), async (req: Request, res: Response) => {
  const teacherId = req.user!.userId;
  await ensureTodaySessions();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const sessions = await ClassSession.find({
    teacherId,
    date: { $gte: today, $lt: tomorrow },
  })
    .populate('paperId', 'name code')
    .populate('semesterId', 'name academicYear')
    .sort({ startTime: 1 });

  // Attach attendance counts
  const result = await Promise.all(
    sessions.map(async (s) => {
      const records = await AttendanceRecord.find({ classSessionId: s._id });
      const present = records.filter((r) => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.LATE).length;
      return { ...s.toObject(), attendanceSummary: { present, total: records.length } };
    })
  );

  res.json({ data: result });
});

// GET /api/teacher/sessions/:sessionId/attendance
router.get('/sessions/:sessionId/attendance', requireRole(Role.TEACHER, Role.ADMIN), async (req, res) => {
  const session = await ClassSession.findById(req.params.sessionId);
  if (!session) throw Errors.NOT_FOUND('ClassSession');

  // Get all current students in the semester
  const memberships = await StudentSemesterMembership.find({ semesterId: session.semesterId, isCurrent: true })
    .populate('studentId', 'name email');

  const records = await AttendanceRecord.find({ classSessionId: session._id });
  const recordMap = new Map(records.map((r) => [r.studentId.toString(), r]));

  const roster = memberships.map((m) => ({
    student: m.studentId,
    record: recordMap.get((m.studentId as any)._id?.toString()) || null,
  }));

  res.json({ data: { session, roster } });
});

// PUT /api/teacher/sessions/:sessionId/attendance  — bulk upsert
router.put('/sessions/:sessionId/attendance', requireRole(Role.TEACHER, Role.ADMIN), async (req: Request, res: Response) => {
  const { records } = z.object({
    records: z.array(z.object({
      studentId: z.string(),
      status: z.nativeEnum(AttendanceStatus),
    })),
  }).parse(req.body);

  const session = await ClassSession.findById(req.params.sessionId);
  if (!session) throw Errors.NOT_FOUND('ClassSession');

  const markedBy = req.user!.userId;
  const now = new Date();

  await Promise.all(
    records.map((r) =>
      AttendanceRecord.findOneAndUpdate(
        { classSessionId: session._id, studentId: r.studentId },
        { status: r.status, markedBy, markedAt: now },
        { upsert: true, new: true }
      )
    )
  );

  // Mark session as completed
  await ClassSession.findByIdAndUpdate(session._id, { status: 'COMPLETED' });

  res.json({ data: { message: 'Attendance saved.', count: records.length } });
});

// ── Student ───────────────────────────────────────────────────────────────────

// GET /api/student/attendance
router.get('/student/summary', requireRole(Role.STUDENT), async (req: Request, res: Response) => {
  const studentId = req.user!.userId;

  const records = await AttendanceRecord.find({ studentId })
    .populate({
      path: 'classSessionId',
      populate: {
        path: 'paperId', select: 'name code',
      },
    });

  // Group by subject offering
  const bySubject: Record<string, { subjectName: string; subjectCode: string; present: number; total: number }> = {};

  for (const r of records) {
    const session = r.classSessionId as any;
    if (!session) continue;
    const paper = session.paperId;
    if (!paper) continue;
    const key = paper._id.toString();
    if (!bySubject[key]) {
      bySubject[key] = { subjectName: paper.name, subjectCode: paper.code, present: 0, total: 0 };
    }
    bySubject[key].total++;
    if (r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.LATE) {
      bySubject[key].present++;
    }
  }

  const subjects = Object.entries(bySubject).map(([id, v]) => ({
    paperId: id,
    ...v,
    percentage: v.total > 0 ? Math.round((v.present / v.total) * 100) : 0,
  }));

  const totalPresent = subjects.reduce((acc, s) => acc + s.present, 0);
  const totalSessions = subjects.reduce((acc, s) => acc + s.total, 0);
  const overallPercentage = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0;

  res.json({ data: { overallPercentage, totalPresent, totalSessions, subjects } });
});

// GET /api/student/attendance/history  — recent sessions
router.get('/student/history', requireRole(Role.STUDENT), async (req: Request, res: Response) => {
  const studentId = req.user!.userId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

  const [records, total] = await Promise.all([
    AttendanceRecord.find({ studentId })
      .populate({
        path: 'classSessionId',
        populate: [
          { path: 'paperId', select: 'name code' },
        ],
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    AttendanceRecord.countDocuments({ studentId }),
  ]);

  res.json({ data: records, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

export default router;
