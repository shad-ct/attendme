import { Router, Request, Response } from 'express';
import { Notification } from './notification.model';
import { authenticate } from '../../shared/middleware/authenticate';
import { Errors } from '../../shared/errors/AppError';

import type { Router as ExpressRouter } from "express";
const router: ExpressRouter = Router();
router.use(authenticate);

// GET /api/notifications
router.get('/', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ recipientUserId: req.user!.userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments({ recipientUserId: req.user!.userId }),
    Notification.countDocuments({ recipientUserId: req.user!.userId, readAt: null }),
  ]);

  res.json({
    data: notifications,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit), unreadCount },
  });
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req: Request, res: Response) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipientUserId: req.user!.userId },
    { readAt: new Date() },
    { new: true }
  );
  if (!notif) throw Errors.NOT_FOUND('Notification');
  res.json({ data: notif });
});

// POST /api/notifications/read-all
router.post('/read-all', async (req: Request, res: Response) => {
  await Notification.updateMany(
    { recipientUserId: req.user!.userId, readAt: null },
    { readAt: new Date() }
  );
  res.json({ data: { message: 'All notifications marked as read.' } });
});

// POST /api/notifications/announce (Teacher only)
router.post('/announce', async (req: Request, res: Response) => {
  if (req.user!.role !== 'TEACHER' && req.user!.role !== 'ADMIN') {
    throw Errors.FORBIDDEN();
  }

  const { semesterId, title, message } = req.body;
  if (!semesterId || !title || !message) {
    return res.status(400).json({ error: { message: 'Missing fields.' } });
  }

  // Get students in this class
  const { StudentSemesterMembership } = await import('../courses/course.model');
  const memberships = await StudentSemesterMembership.find({ semesterId, isCurrent: true });

  await Notification.insertMany(
    memberships.map((m) => ({
      recipientUserId: m.studentId,
      type: 'ANNOUNCEMENT',
      title,
      message,
    }))
  );

  res.json({ data: { message: 'Announcement sent to class.' } });
});

export default router;
