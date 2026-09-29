import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@attendme/shared';
import { Paper } from './paper.model';
import { authenticate, requireRole } from '../../shared/middleware/authenticate';
import { Errors } from '../../shared/errors/AppError';

import type { Router as ExpressRouter } from "express";
const router: ExpressRouter = Router();
router.use(authenticate, requireRole(Role.ADMIN));

router.get('/papers', async (req, res) => {
  const semesterId = req.query.semesterId as string;
  const filter = semesterId ? { semesterId } : {};
  const papers = await Paper.find(filter)
    .populate('semesterId', 'name academicYear')
    .populate('teacherId', 'name email')
    .sort({ code: 1 });
  res.json({ data: papers });
});

router.post('/papers', async (req, res) => {
  const body = z.object({
    code: z.string().min(1),
    name: z.string().min(1),
    credits: z.number().optional(),
    semesterId: z.string(),
    teacherId: z.string(),
  }).parse(req.body);
  const paper = await Paper.create(body);
  res.status(201).json({ data: paper });
});

router.patch('/papers/:id', async (req, res) => {
  const paper = await Paper.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!paper) throw Errors.NOT_FOUND('Paper');
  res.json({ data: paper });
});

router.delete('/papers/:id', async (req, res) => {
  await Paper.findByIdAndDelete(req.params.id);
  res.json({ data: { message: 'Paper deleted.' } });
});

export default router;
