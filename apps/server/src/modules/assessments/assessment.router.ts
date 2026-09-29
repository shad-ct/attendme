import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Role, AssessmentStatus, AssessmentType, NotificationType } from '@attendme/shared';
import { Assessment, AssessmentMark } from './assessment.model';
import { StudentSemesterMembership } from '../courses/course.model';
import { Notification } from '../notifications/notification.model';
import { authenticate, requireRole } from '../../shared/middleware/authenticate';
import { Errors } from '../../shared/errors/AppError';

import type { Router as ExpressRouter } from "express";
const router: ExpressRouter = Router();
router.use(authenticate);

// ── Teacher ───────────────────────────────────────────────────────────────────

router.get('/teacher', requireRole(Role.TEACHER, Role.ADMIN), async (req: Request, res: Response) => {
  const paperId = req.query.paperId as string;
  const filter = paperId ? { paperId } : {};
  const assessments = await Assessment.find(filter)
    .populate('paperId', 'name code')
    .sort({ createdAt: -1 });
  res.json({ data: assessments });
});

router.post('/teacher', requireRole(Role.TEACHER, Role.ADMIN), async (req: Request, res: Response) => {
  const body = z.object({
    paperId: z.string(),
    semesterIds: z.array(z.string()).min(1),
    title: z.string().min(1),
    type: z.nativeEnum(AssessmentType),
    date: z.string().optional(),
    maxMarks: z.number().positive(),
    weightage: z.number().optional(),
    description: z.string().optional(),
  }).parse(req.body);

  const { semesterIds, ...rest } = body;
  
  const assessments = await Promise.all(
    semesterIds.map(semId => 
      Assessment.create({ ...rest, semesterId: semId, createdBy: req.user!.userId })
    )
  );

  // Notify students
  const memberships = await StudentSemesterMembership.find({ semesterId: { $in: semesterIds }, isCurrent: true });
  await Notification.insertMany(
    memberships.map((m) => {
      // Find the specific assessment for this student's semester
      const a = assessments.find(a => a.semesterId.toString() === m.semesterId.toString());
      return {
        recipientUserId: m.studentId,
        type: NotificationType.ANNOUNCEMENT,
        title: `New ${body.type.replace('_', ' ')}`,
        message: `${body.title} has been added.`,
        entityType: 'Assessment',
        entityId: a?._id,
      };
    })
  );

  res.status(201).json({ data: assessments });
});

router.patch('/teacher/:id', requireRole(Role.TEACHER, Role.ADMIN), async (req, res) => {
  const assessment = await Assessment.findById(req.params.id);
  if (!assessment) throw Errors.NOT_FOUND('Assessment');
  if (assessment.status === AssessmentStatus.LOCKED) throw Errors.FORBIDDEN();
  await assessment.set(req.body).save();
  res.json({ data: assessment });
});

// PUT /teacher/assessments/:id/marks — bulk entry
router.put('/teacher/:id/marks', requireRole(Role.TEACHER, Role.ADMIN), async (req: Request, res: Response) => {
  const assessment = await Assessment.findById(req.params.id);
  if (!assessment) throw Errors.NOT_FOUND('Assessment');
  if (assessment.status === AssessmentStatus.LOCKED) throw Errors.FORBIDDEN();

  const { marks } = z.object({
    marks: z.array(z.object({ studentId: z.string(), marks: z.number().min(0) })),
  }).parse(req.body);

  await Promise.all(
    marks.map((m) =>
      AssessmentMark.findOneAndUpdate(
        { assessmentId: assessment._id, studentId: m.studentId },
        { marks: m.marks, enteredBy: req.user!.userId },
        { upsert: true, new: true }
      )
    )
  );

  res.json({ data: { message: 'Marks saved.', count: marks.length } });
});

// POST /teacher/assessments/:id/publish
router.post('/teacher/:id/publish', requireRole(Role.TEACHER, Role.ADMIN), async (req: Request, res: Response) => {
  const assessment = await Assessment.findById(req.params.id);
  if (!assessment) throw Errors.NOT_FOUND('Assessment');
  if (assessment.status === AssessmentStatus.LOCKED) throw Errors.FORBIDDEN();

  assessment.status = AssessmentStatus.PUBLISHED;
  await assessment.save();

  // Notify students
  const memberships = await StudentSemesterMembership.find({ semesterId: assessment.semesterId, isCurrent: true });
  await Notification.insertMany(
    memberships.map((m) => ({
      recipientUserId: m.studentId,
      type: NotificationType.MARKS_PUBLISHED,
      title: 'Marks published',
      message: `${assessment.title} marks are now available.`,
      entityType: 'Assessment',
      entityId: assessment._id,
    }))
  );

  res.json({ data: assessment });
});

// POST /teacher/assessments/:id/lock
router.post('/teacher/:id/lock', requireRole(Role.ADMIN), async (req, res) => {
  const assessment = await Assessment.findByIdAndUpdate(
    req.params.id,
    { status: AssessmentStatus.LOCKED },
    { new: true }
  );
  if (!assessment) throw Errors.NOT_FOUND('Assessment');
  res.json({ data: assessment });
});

// ── Student ───────────────────────────────────────────────────────────────────

router.get('/student', requireRole(Role.STUDENT), async (req: Request, res: Response) => {
  // Get student's current class
  const { StudentProfile } = await import('../users/profile.model');
  const profile = await StudentProfile.findOne({ userId: req.user!.userId });
  if (!profile?.currentSemesterId) return res.json({ data: [] });

  const assessments = await Assessment.find({
    semesterId: profile.currentSemesterId,
    status: AssessmentStatus.PUBLISHED,
  }).populate('paperId', 'name code');

  const withMarks = await Promise.all(
    assessments.map(async (a) => {
      const mark = await AssessmentMark.findOne({ assessmentId: a._id, studentId: req.user!.userId });
      return { ...a.toObject(), myMark: mark?.marks ?? null };
    })
  );

  res.json({ data: withMarks });
});

export default router;
