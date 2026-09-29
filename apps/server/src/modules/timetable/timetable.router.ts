import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Role, DayOfWeek } from '@attendme/shared';
import { TimetableEntry, ClassSession } from './timetable.model';
import { Paper } from '../papers/paper.model';
import { authenticate, requireRole } from '../../shared/middleware/authenticate';
import { Errors } from '../../shared/errors/AppError';

import type { Router as ExpressRouter } from "express";
const router: ExpressRouter = Router();
router.use(authenticate);

const entrySchema = z.object({
  semesterId: z.string(),
  paperId: z.string(),
  dayOfWeek: z.nativeEnum(DayOfWeek),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

// Student timetable — read from current semester
router.get('/semesters/student', requireRole(Role.STUDENT), async (req: Request, res: Response) => {
  const { StudentProfile } = await import('../users/profile.model');
  const profile = await StudentProfile.findOne({ userId: req.user!.userId });
  if (!profile?.currentSemesterId) return res.json({ data: [] });

  const entries = await TimetableEntry.find({ semesterId: profile.currentSemesterId, isActive: true })
    .populate('paperId', 'name code')
    .populate('teacherId', 'name')
    .sort({ dayOfWeek: 1, startTime: 1 });
  res.json({ data: entries });
});

// GET /api/admin/timetable/semesters/:semesterId
router.get('/semesters/:semesterId', async (req, res) => {
  const entries = await TimetableEntry.find({ semesterId: req.params.semesterId, isActive: true })
    .populate('paperId', 'name code')
    .populate('teacherId', 'name')
    .sort({ dayOfWeek: 1, startTime: 1 });
  res.json({ data: entries });
});


// Teacher timetable
router.get('/teacher', requireRole(Role.TEACHER, Role.ADMIN), async (req: Request, res: Response) => {
  const teacherId = req.user!.role === Role.ADMIN
    ? (req.query.teacherId as string)
    : req.user!.userId;

  const entries = await TimetableEntry.find({ teacherId, isActive: true })
    .populate({ path: 'paperId', populate: { path: 'semesterId', select: 'name academicYear' } })
    .sort({ dayOfWeek: 1, startTime: 1 });
  res.json({ data: entries });
});

// POST /api/admin/timetable/entries
router.post('/entries', requireRole(Role.ADMIN), async (req, res) => {
  const body = entrySchema.parse(req.body);
  
  // Get paper to find teacher
  const paper = await Paper.findById(body.paperId);
  if (!paper) throw Errors.NOT_FOUND('Paper');

  // Check teacher conflict
  const conflict = await TimetableEntry.findOne({
    teacherId: paper.teacherId,
    dayOfWeek: body.dayOfWeek,
    isActive: true,
    $or: [
      { startTime: { $lt: body.endTime }, endTime: { $gt: body.startTime } },
    ],
  });
  if (conflict) throw Errors.CONFLICT('This teacher is already scheduled at this time.');

  const entry = await TimetableEntry.create({ ...body, teacherId: paper.teacherId });
  res.status(201).json({ data: entry });
});

// PATCH /api/admin/timetable/entries/:id
router.patch('/entries/:id', requireRole(Role.ADMIN), async (req, res) => {
  const entry = await TimetableEntry.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!entry) throw Errors.NOT_FOUND('TimetableEntry');
  res.json({ data: entry });
});

// DELETE /api/admin/timetable/entries/:id
router.delete('/entries/:id', requireRole(Role.ADMIN), async (req, res) => {
  await TimetableEntry.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ data: { message: 'Timetable entry removed.' } });
});

// POST /api/admin/timetable/bulk-update  — array of entry upserts
router.post('/bulk-update', requireRole(Role.ADMIN), async (req, res) => {
  const { entries } = z.object({ entries: z.array(entrySchema.partial({ semesterId: true })) }).parse(req.body);
  const results = [];
  for (const e of entries) {
    if (e.paperId) {
       const paper = await Paper.findById(e.paperId);
       if (paper) {
         const entry = await TimetableEntry.create({ ...e, teacherId: paper.teacherId });
         results.push(entry);
       }
    }
  }
  res.status(201).json({ data: results });
});

// Generate today's sessions from timetable
export async function ensureTodaySessions(semesterId?: string): Promise<void> {
  const today = new Date();
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const todayDay = days[today.getDay()] as DayOfWeek;

  const filter: Record<string, unknown> = { dayOfWeek: todayDay, isActive: true };
  if (semesterId) filter.semesterId = semesterId;

  const entries = await TimetableEntry.find(filter);
  const todayStart = new Date(today.setHours(0, 0, 0, 0));

  for (const e of entries) {
    await ClassSession.findOneAndUpdate(
      { timetableEntryId: e._id, date: todayStart },
      {
        timetableEntryId: e._id,
        semesterId: e.semesterId,
        paperId: e.paperId,
        teacherId: e.teacherId,
        date: todayStart,
        startTime: e.startTime,
        endTime: e.endTime,
        status: 'SCHEDULED',
      },
      { upsert: true, new: true }
    );
  }
}

export default router;
