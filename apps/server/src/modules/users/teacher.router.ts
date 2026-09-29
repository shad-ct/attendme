import { Router, Request, Response } from 'express';
import { Role } from '@attendme/shared';
import { authenticate, requireRole } from '../../shared/middleware/authenticate';
import { Paper } from '../papers/paper.model';
import { Semester, StudentSemesterMembership } from '../courses/course.model';
import { AttendanceRecord } from '../attendance/attendance.model';
import { ClassSession } from '../timetable/timetable.model';
import { Assessment, AssessmentMark } from '../assessments/assessment.model';
import { Errors } from '../../shared/errors/AppError';

import type { Router as ExpressRouter } from "express";
const router: ExpressRouter = Router();
router.use(authenticate);
router.use(requireRole(Role.TEACHER, Role.ADMIN));

// GET /api/teacher/classes
// Returns unique semesters (classes) the teacher teaches
router.get('/classes', async (req: Request, res: Response) => {
  const teacherId = req.user!.userId;
  
  // Find all papers assigned to this teacher
  const papers = await Paper.find({ teacherId });
  const semesterIds = [...new Set(papers.map(p => p.semesterId.toString()))];
  
  // Fetch those semesters
  const semesters = await Semester.find({ _id: { $in: semesterIds } })
    .populate('courseId', 'name code')
    .sort({ academicYear: -1, sequence: 1 });
    
  // Attach the papers the teacher teaches in each semester
  const result = semesters.map(sem => {
    const semObj = sem.toObject();
    const semPapers = papers.filter(p => p.semesterId.toString() === sem._id.toString());
    return {
      ...semObj,
      myPapers: semPapers,
    };
  });
  
  res.json({ data: result });
});

// GET /api/teacher/classes/:semesterId/students
router.get('/classes/:semesterId/students', async (req: Request, res: Response) => {
  const teacherId = req.user!.userId;
  const semesterId = req.params.semesterId;
  
  const memberships = await StudentSemesterMembership.find({ semesterId, isCurrent: true })
    .populate('studentId', 'name email');
    
  // Get all papers the teacher teaches in this semester
  const teacherPapers = await Paper.find({ teacherId, semesterId });
  const paperIds = teacherPapers.map(p => p._id);
  
  // Get attendance records for these students in these papers
  const sessions = await ClassSession.find({ paperId: { $in: paperIds } });
  const sessionIds = sessions.map(s => s._id);
  
  const attendanceRecords = await AttendanceRecord.find({ classSessionId: { $in: sessionIds } });
  
  // Group attendance by student
  const attendanceByStudent = attendanceRecords.reduce((acc, r) => {
    const sId = r.studentId.toString();
    if (!acc[sId]) acc[sId] = { present: 0, total: 0 };
    acc[sId].total++;
    if (r.status === 'PRESENT' || r.status === 'LATE') acc[sId].present++;
    return acc;
  }, {} as Record<string, { present: number, total: number }>);
  
  const result = memberships.map(m => {
    const sId = (m.studentId as any)._id.toString();
    const att = attendanceByStudent[sId] || { present: 0, total: 0 };
    const attendancePercentage = att.total > 0 ? Math.round((att.present / att.total) * 100) : null;
    
    return {
      student: m.studentId,
      attendancePercentage,
      attendanceSummary: att,
    };
  });
  
  res.json({ data: result });
});

// GET /api/teacher/classes/:semesterId/student/:studentId
router.get('/classes/:semesterId/student/:studentId', async (req: Request, res: Response) => {
  const teacherId = req.user!.userId;
  const { semesterId, studentId } = req.params;
  
  // 1. Papers taught by this teacher in this semester
  const papers = await Paper.find({ teacherId, semesterId });
  const paperIds = papers.map(p => p._id);
  
  // 2. Attendance grouped by paper
  const sessions = await ClassSession.find({ paperId: { $in: paperIds } });
  const sessionMap = new Map(sessions.map(s => [s._id.toString(), s.paperId.toString()]));
  
  const attRecords = await AttendanceRecord.find({ 
    studentId, 
    classSessionId: { $in: sessions.map(s => s._id) } 
  });
  
  const attendanceByPaper: Record<string, { present: 0, total: 0, history: any[] }> = {};
  for (const pid of paperIds) {
    attendanceByPaper[pid.toString()] = { present: 0, total: 0, history: [] };
  }
  
  for (const r of attRecords) {
    const pId = sessionMap.get(r.classSessionId.toString());
    if (pId && attendanceByPaper[pId]) {
      attendanceByPaper[pId].total++;
      if (r.status === 'PRESENT' || r.status === 'LATE') attendanceByPaper[pId].present++;
      
      const sessionObj = sessions.find(s => s._id.toString() === r.classSessionId.toString());
      attendanceByPaper[pId].history.push({
        date: sessionObj?.date,
        status: r.status
      });
    }
  }
  
  // Sort history
  for (const pid of paperIds) {
    attendanceByPaper[pid.toString()].history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // 3. Assessments & Marks grouped by paper
  const assessments = await Assessment.find({ paperId: { $in: paperIds } });
  const marks = await AssessmentMark.find({ 
    studentId, 
    assessmentId: { $in: assessments.map(a => a._id) } 
  });
  
  const marksMap = new Map(marks.map(m => [m.assessmentId.toString(), m.marks]));
  
  const assessmentsByPaper: Record<string, any[]> = {};
  for (const pid of paperIds) {
    assessmentsByPaper[pid.toString()] = [];
  }
  
  for (const a of assessments) {
    const pId = a.paperId.toString();
    assessmentsByPaper[pId].push({
      assessment: a,
      mark: marksMap.get(a._id.toString()) ?? null
    });
  }
  
  const result = papers.map(p => {
    const pid = p._id.toString();
    const att = attendanceByPaper[pid];
    return {
      paper: p,
      attendance: {
        ...att,
        percentage: att.total > 0 ? Math.round((att.present / att.total) * 100) : null
      },
      assessments: assessmentsByPaper[pid]
    };
  });
  
  res.json({ data: result });
});

export default router;
