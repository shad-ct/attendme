import { Router } from 'express';
import { Role } from '@attendme/shared';
import { Paper } from './paper.model';
import { authenticate, requireRole } from '../../shared/middleware/authenticate';

import type { Router as ExpressRouter } from "express";
const router: ExpressRouter = Router();
router.use(authenticate);

// Teacher: Get assigned papers
router.get('/teacher', requireRole(Role.TEACHER, Role.ADMIN), async (req, res) => {
  const teacherId = req.user!.userId;
  const papers = await Paper.find({ teacherId })
    .populate('semesterId', 'name academicYear')
    .sort({ code: 1 });
  res.json({ data: papers });
});

export default router;
