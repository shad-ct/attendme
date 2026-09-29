import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Role, EventType, EventStatus, NotificationType } from '@attendme/shared';
import { Event } from './event.model';
import { StudentSemesterMembership } from '../courses/course.model';
import { Notification } from '../notifications/notification.model';
import { authenticate, requireRole } from '../../shared/middleware/authenticate';
import { Errors } from '../../shared/errors/AppError';

import type { Router as ExpressRouter } from "express";
const router: ExpressRouter = Router();
router.use(authenticate);

const eventSchema = z.object({
  type: z.nativeEnum(EventType),
  title: z.string().min(1),
  semesterId: z.string(),
  paperId: z.string().optional(),
  description: z.string().optional(),
  eventDate: z.string().optional(),
  dueDate: z.string().optional(),
  expectedMarks: z.number().optional(),
});

// ── Admin ───────────────────────────────────────────────────────────────────

router.get('/admin', requireRole(Role.ADMIN), async (req: Request, res: Response) => {
  const semesterId = req.query.semesterId as string;
  const filter: Record<string, unknown> = semesterId ? { semesterId } : {};
  const events = await Event.find(filter)
    .populate('paperId', 'name code')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });
  res.json({ data: events });
});

router.post('/admin', requireRole(Role.ADMIN), async (req: Request, res: Response) => {
  const body = eventSchema.parse(req.body);
  const event = await Event.create({ ...body, createdBy: req.user!.userId });
  res.status(201).json({ data: event });
});

router.patch('/admin/:id', requireRole(Role.ADMIN), async (req, res) => {
  const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!event) throw Errors.NOT_FOUND('Event');
  res.json({ data: event });
});

router.delete('/admin/:id', requireRole(Role.ADMIN), async (req, res) => {
  await Event.findByIdAndDelete(req.params.id);
  res.json({ data: { message: 'Event removed.' } });
});

// Teacher: list their events
router.get('/teacher', requireRole(Role.TEACHER, Role.ADMIN), async (req: Request, res: Response) => {
  const semesterId = req.query.semesterId as string;
  const filter: Record<string, unknown> = semesterId ? { semesterId } : {};
  const events = await Event.find(filter).sort({ createdAt: -1 });
  res.json({ data: events });
});

// Teacher: create event
router.post('/teacher', requireRole(Role.TEACHER, Role.ADMIN), async (req: Request, res: Response) => {
  const body = eventSchema.parse(req.body);
  const event = await Event.create({ ...body, createdBy: req.user!.userId });
  res.status(201).json({ data: event });
});

// Teacher: update event
router.patch('/teacher/:id', requireRole(Role.TEACHER, Role.ADMIN), async (req, res) => {
  const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!event) throw Errors.NOT_FOUND('Event');
  res.json({ data: event });
});

// Teacher: publish event
router.post('/teacher/:id/publish', requireRole(Role.TEACHER, Role.ADMIN), async (req: Request, res: Response) => {
  const event = await Event.findByIdAndUpdate(
    req.params.id,
    { status: EventStatus.PUBLISHED },
    { new: true }
  );
  if (!event) throw Errors.NOT_FOUND('Event');

  const notifType =
    event.type === EventType.EXAM ? NotificationType.NEW_EXAM :
    event.type === EventType.ANNOUNCEMENT ? NotificationType.ANNOUNCEMENT :
    NotificationType.NEW_ASSIGNMENT;

  const memberships = await StudentSemesterMembership.find({ semesterId: event.semesterId, isCurrent: true });
  await Notification.insertMany(
    memberships.map((m) => ({
      recipientUserId: m.studentId,
      type: notifType,
      title: event.title,
      message: event.description || `${event.type} posted.`,
      entityType: 'Event',
      entityId: event._id,
    }))
  );

  res.json({ data: event });
});

// Student: list published events for their semester
router.get('/student', requireRole(Role.STUDENT), async (req: Request, res: Response) => {
  const { StudentProfile } = await import('../users/profile.model');
  const profile = await StudentProfile.findOne({ userId: req.user!.userId });
  if (!profile?.currentSemesterId) return res.json({ data: [] });

  const events = await Event.find({
    semesterId: profile.currentSemesterId,
    status: EventStatus.PUBLISHED,
  })
    .populate('paperId', 'name code')
    .sort({ eventDate: 1, dueDate: 1 });

  res.json({ data: events });
});

export default router;
