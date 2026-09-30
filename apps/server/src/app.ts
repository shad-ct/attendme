import 'express-async-errors';
import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { errorHandler } from './shared/middleware/errorHandler';

// Routers
import authRouter from './modules/auth/auth.router';
import adminUsersRouter from './modules/users/admin-users.router';
import adminCoursesRouter from './modules/courses/admin-courses.router';
import adminPapersRouter from './modules/papers/admin-papers.router';
import teacherRouter from './modules/users/teacher.router';
import papersRouter from './modules/papers/papers.router';
import coursesRouter from './modules/courses/courses.router';
import timetableRouter from './modules/timetable/timetable.router';
import attendanceRouter from './modules/attendance/attendance.router';
import assessmentRouter from './modules/assessments/assessment.router';
import eventRouter from './modules/events/event.router';
import notificationRouter from './modules/notifications/notification.router';
import auditRouter from './modules/audit/audit.router';

const app: Express = express();

// ── Core middleware ───────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: [config.corsOrigin, 'https://attendme.rafsal.in'], credentials: true }));
app.use(express.json({ limit: '1mb' }));
if (config.nodeEnv === 'development') app.use(morgan('dev'));

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', env: config.nodeEnv }));

// ── Auth ──────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);

// ── Admin ─────────────────────────────────────────────────────────────────────
app.use('/api/admin/users', adminUsersRouter);
app.use('/api/admin', adminCoursesRouter);
app.use('/api/admin', adminPapersRouter);
app.use('/api/admin/timetable', timetableRouter);
app.use('/api/admin/audit-logs', auditRouter);

// ── Academic (teacher/student) ────────────────────────────────────────────────
app.use('/api/courses', coursesRouter);
app.use('/api/papers', papersRouter);

// ── Teacher Classes ───────────────────────────────────────────────────────────
app.use('/api/teacher', teacherRouter);

// ── Timetable (teacher) ───────────────────────────────────────────────────────
app.use('/api/timetable', timetableRouter);

// ── Attendance ────────────────────────────────────────────────────────────────
app.use('/api/attendance', attendanceRouter);

// ── Assessments / Marks ───────────────────────────────────────────────────────
app.use('/api/assessments', assessmentRouter);

// ── Events ────────────────────────────────────────────────────────────────────
app.use('/api/events', eventRouter);

// ── Notifications ─────────────────────────────────────────────────────────────
app.use('/api/notifications', notificationRouter);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
