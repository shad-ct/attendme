import { Router, Request, Response } from 'express';
import { Role } from '@attendme/shared';
import { AuditLog } from './audit.model';
import { authenticate, requireRole } from '../../shared/middleware/authenticate';

import type { Router as ExpressRouter } from "express";
const router: ExpressRouter = Router();
router.use(authenticate, requireRole(Role.ADMIN));

router.get('/', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const entityType = req.query.entityType as string;
  const filter = entityType ? { entityType } : {};

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('actorUserId', 'name email role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    AuditLog.countDocuments(filter),
  ]);

  res.json({ data: logs, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

export default router;
