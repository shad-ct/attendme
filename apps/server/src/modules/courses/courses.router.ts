import { Router } from 'express';
import { Role } from '@attendme/shared';
import { Semester, StudentSemesterMembership } from './course.model';
import { authenticate, requireRole } from '../../shared/middleware/authenticate';
import { Errors } from '../../shared/errors/AppError';

import type { Router as ExpressRouter } from "express";
const router: ExpressRouter = Router();
router.use(authenticate);

// Teacher: Get students in a semester
router.get('/teacher/semesters/:id/students', requireRole(Role.TEACHER, Role.ADMIN), async (req, res) => {
  const memberships = await StudentSemesterMembership.find({ semesterId: req.params.id, isCurrent: true })
    .populate({ path: 'studentId', select: 'name email' });
  res.json({ data: memberships });
});

export default router;
