import 'dotenv/config';
import mongoose from 'mongoose';
import { config } from '../config';
import { User } from '../modules/users/user.model';
import { StudentProfile } from '../modules/users/profile.model';
import { Semester } from '../modules/courses/course.model';
import { Paper } from '../modules/papers/paper.model';
import { TimetableEntry, ClassSession } from '../modules/timetable/timetable.model';
import { AttendanceRecord } from '../modules/attendance/attendance.model';
import { Assessment, AssessmentMark } from '../modules/assessments/assessment.model';
import { Event } from '../modules/events/event.model';
import { Notification } from '../modules/notifications/notification.model';
import { AuditLog } from '../modules/audit/audit.model';
import { Role, AttendanceStatus, AssessmentType, AssessmentStatus, EventType, EventStatus, NotificationType, DayOfWeek } from '@attendme/shared';
import { addDays, subDays, format, getDay, isWeekend } from 'date-fns';

async function seedHistory() {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB. Generating historical data...');

  const admin = await User.findOne({ role: Role.ADMIN });
  const teachers = await User.find({ role: Role.TEACHER });
  const students = await User.find({ role: Role.STUDENT });
  const targetSemester = await Semester.findOne({ name: 'Semester 4' });

  if (!admin || !teachers.length || !students.length || !targetSemester) {
    console.error('Core data not found. Please run regular seed script first.');
    process.exit(1);
  }

  const papers = await Paper.find({ semesterId: targetSemester._id });
  const timetable = await TimetableEntry.find({ semesterId: targetSemester._id });

  if (!timetable.length) {
    console.error('Timetable not found.');
    process.exit(1);
  }

  // Clear existing history
  await Promise.all([
    ClassSession.deleteMany({}),
    AttendanceRecord.deleteMany({}),
    Assessment.deleteMany({}),
    AssessmentMark.deleteMany({}),
    Event.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  console.log('Cleared existing history records.');

  // 1. Generate 30 days of past attendance
  const today = new Date();
  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  
  let totalSessionsCreated = 0;
  let totalAttendanceCreated = 0;

  for (let i = 30; i >= 1; i--) {
    const targetDate = subDays(today, i);
    if (isWeekend(targetDate)) continue;

    const dayName = dayNames[getDay(targetDate)];
    const todaysTimetable = timetable.filter(t => t.dayOfWeek === dayName);

    for (const entry of todaysTimetable) {
      // Create a class session
      const presentCount = Math.floor(Math.random() * 3) + (students.length - 2); // mostly present
      
      const session = await ClassSession.create({
        timetableEntryId: entry._id,
        semesterId: entry.semesterId,
        paperId: entry.paperId,
        teacherId: entry.teacherId,
        date: targetDate,
        startTime: entry.startTime,
        endTime: entry.endTime,
        status: 'COMPLETED',
        attendanceSummary: {
          total: students.length,
          present: presentCount,
          absent: students.length - presentCount,
        }
      });
      totalSessionsCreated++;

      // Create attendance records
      const records = students.map(student => {
        const r = Math.random();
        let status = AttendanceStatus.PRESENT;
        if (r > 0.9) status = AttendanceStatus.ABSENT;
        else if (r > 0.8) status = AttendanceStatus.LATE;

        return {
          classSessionId: session._id,
          studentId: student._id,
          status,
          markedBy: entry.teacherId,
        };
      });
      
      await AttendanceRecord.insertMany(records);
      totalAttendanceCreated += records.length;
    }
  }
  console.log(`✅ Generated ${totalSessionsCreated} class sessions with ${totalAttendanceCreated} attendance records.`);

  // 2. Generate Assessments & Marks
  const assessmentTypes = [AssessmentType.INTERNAL_EXAM, AssessmentType.CE, AssessmentType.ASSIGNMENT];
  
  for (const paper of papers) {
    const type = assessmentTypes[Math.floor(Math.random() * assessmentTypes.length)];
    const maxMarks = type === AssessmentType.INTERNAL_EXAM ? 50 : 20;
    
    const assessment = await Assessment.create({
      paperId: paper._id,
      semesterId: targetSemester._id,
      title: `${type} 1 - ${paper.code}`,
      type,
      date: subDays(today, Math.floor(Math.random() * 20) + 5).toISOString(),
      maxMarks,
      weightage: 10,
      status: AssessmentStatus.PUBLISHED,
      createdBy: teachers[Math.floor(Math.random() * teachers.length)]._id,
    });

    const marks = students.map(student => {
      // random score between 40% and 100%
      const score = Math.floor(maxMarks * (0.4 + Math.random() * 0.6));
      return {
        assessmentId: assessment._id,
        studentId: student._id,
        marks: score,
        enteredBy: assessment.createdBy,
      };
    });

    await AssessmentMark.insertMany(marks);
  }
  console.log(`✅ Generated ${papers.length} assessments and marks.`);

  // 3. Generate Events
  const events = [
    { type: EventType.ASSIGNMENT, title: 'DBMS Assignment 2', daysOffset: 2 },
    { type: EventType.EXAM, title: 'OS Mid-Term Exam', daysOffset: 5 },
    { type: EventType.ANNOUNCEMENT, title: 'Guest Lecture in Auditorium', daysOffset: 1 },
    { type: EventType.QUIZ, title: 'DSA Pop Quiz', daysOffset: -2 },
  ];

  for (const e of events) {
    const eventDate = e.daysOffset > 0 ? addDays(today, e.daysOffset) : subDays(today, Math.abs(e.daysOffset));
    const teacher = teachers[Math.floor(Math.random() * teachers.length)];
    
    await Event.create({
      type: e.type,
      title: e.title,
      semesterId: targetSemester._id,
      description: 'Please be prepared.',
      eventDate: eventDate.toISOString(),
      dueDate: e.type === EventType.ASSIGNMENT ? eventDate.toISOString() : undefined,
      status: EventStatus.PUBLISHED,
      createdBy: teacher._id,
    });
  }
  console.log(`✅ Generated ${events.length} events (upcoming and past).`);

  // 4. Generate Notifications
  const notifications = [];
  for (const student of students) {
    notifications.push({
      recipientUserId: student._id,
      type: NotificationType.ANNOUNCEMENT,
      title: 'Welcome to Semester 4',
      message: 'Classes commence from tomorrow. Check your timetable.',
      readAt: subDays(today, 25),
    });
    
    // Add an unread notification
    notifications.push({
      recipientUserId: student._id,
      type: NotificationType.MARKS_PUBLISHED,
      title: 'New Marks Published',
      message: 'Your recent internal marks have been published by your teacher.',
      readAt: null,
    });
  }
  await Notification.insertMany(notifications);
  console.log(`✅ Generated ${notifications.length} notifications for students.`);

  // 5. Generate Audit Logs
  const auditLogs = [];
  for (let i = 0; i < 20; i++) {
    const isTeacher = Math.random() > 0.5;
    const actor = isTeacher ? teachers[Math.floor(Math.random() * teachers.length)] : admin;
    
    auditLogs.push({
      actorUserId: actor._id,
      action: isTeacher ? 'UPDATE' : 'CREATE',
      entityType: isTeacher ? 'Attendance' : 'User',
      entityId: new mongoose.Types.ObjectId().toString(),
      details: { info: 'Random audit action generated via seed script.' },
      ipAddress: '192.168.1.100',
      createdAt: subDays(today, Math.floor(Math.random() * 30)),
    });
  }
  await AuditLog.insertMany(auditLogs);
  console.log(`✅ Generated ${auditLogs.length} admin audit logs.`);

  console.log('\n🎉 Historical Data Seed complete!');
  await mongoose.disconnect();
}

seedHistory().catch(err => {
  console.error('Seed history failed:', err);
  process.exit(1);
});
