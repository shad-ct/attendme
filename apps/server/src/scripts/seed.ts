import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import { User } from '../modules/users/user.model';
import { StudentProfile, TeacherProfile } from '../modules/users/profile.model';
import { Course, Semester, StudentSemesterMembership } from '../modules/courses/course.model';
import { Paper } from '../modules/papers/paper.model';
import { TimetableEntry } from '../modules/timetable/timetable.model';
import { Role, DayOfWeek } from '@attendme/shared';

async function seed() {
  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB. Seeding...');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    StudentProfile.deleteMany({}),
    TeacherProfile.deleteMany({}),
    Course.deleteMany({}),
    Semester.deleteMany({}),
    StudentSemesterMembership.deleteMany({}),
    Paper.deleteMany({}),
    TimetableEntry.deleteMany({}),
  ]);

  const hash = (pw: string) => bcrypt.hash(pw, 12);

  // ── Admin ──────────────────────────────────────────────────────────────────
  const adminUser = await User.create({
    name: 'Admin',
    email: 'admin@attendme.edu',
    passwordHash: await hash('admin123'),
    role: Role.ADMIN,
  });
  console.log('✅ Admin created: admin@attendme.edu / admin123');

  // ── Teachers ───────────────────────────────────────────────────────────────
  const teacherData = [
    { name: 'Dr. Suresh Kumar', email: 'suresh@attendme.edu', employeeId: 'EMP001' },
    { name: 'Prof. Meena Iyer', email: 'meena@attendme.edu', employeeId: 'EMP002' },
    { name: 'Dr. Rajesh Nair', email: 'rajesh@attendme.edu', employeeId: 'EMP003' },
  ];

  const teachers = await Promise.all(
    teacherData.map(async (t) => {
      const user = await User.create({
        name: t.name,
        email: t.email,
        passwordHash: await hash('teacher123'),
        role: Role.TEACHER,
      });
      await TeacherProfile.create({ userId: user._id, employeeId: t.employeeId });
      return user;
    })
  );
  console.log('✅ 3 teachers created (password: teacher123)');

  // ── Students ───────────────────────────────────────────────────────────────
  const studentData = [
    { name: 'Ananya Nair', email: 'ananya@student.attendme.edu', studentId: 'CS21001' },
    { name: 'Rahul Menon', email: 'rahul@student.attendme.edu', studentId: 'CS21002' },
    { name: 'Fathima Rasheed', email: 'fathima@student.attendme.edu', studentId: 'CS21003' },
    { name: 'Arjun Pillai', email: 'arjun@student.attendme.edu', studentId: 'CS21004' },
    { name: 'Divya Krishnan', email: 'divya@student.attendme.edu', studentId: 'CS21005' },
    { name: 'Mohammed Fasal', email: 'fasal@student.attendme.edu', studentId: 'CS21006' },
    { name: 'Sneha Thomas', email: 'sneha@student.attendme.edu', studentId: 'CS21007' },
    { name: 'Vishnu Prasad', email: 'vishnu@student.attendme.edu', studentId: 'CS21008' },
  ];

  const students = await Promise.all(
    studentData.map(async (s) => {
      const user = await User.create({
        name: s.name,
        email: s.email,
        passwordHash: await hash('student123'),
        role: Role.STUDENT,
      });
      await StudentProfile.create({ userId: user._id, studentId: s.studentId });
      return user;
    })
  );
  console.log('✅ 8 students created (password: student123)');

  // ── Academic Structure ─────────────────────────────────────────────────────
  const course = await Course.create({
    name: 'B.Tech Computer Science',
    code: 'BTCS',
    description: 'Bachelor of Technology in Computer Science and Engineering',
  });

  const semester = await Semester.create({
    courseId: course._id,
    name: 'Semester 4',
    academicYear: '2025-26',
    sequence: 4,
  });

  // Assign students to semester
  await Promise.all(
    students.map(async (s) => {
      await StudentSemesterMembership.create({ studentId: s._id, semesterId: semester._id, isCurrent: true });
      await StudentProfile.findOneAndUpdate({ userId: s._id }, { currentSemesterId: semester._id });
    })
  );
  console.log('✅ Course / Semester created');

  // ── Papers ───────────────────────────────────────────────────────────────
  const paperData = [
    { code: 'DBMS', name: 'Database Management Systems', credits: 4, teacherIdx: 0 },
    { code: 'OS', name: 'Operating Systems', credits: 4, teacherIdx: 0 },
    { code: 'DSA', name: 'Data Structures & Algorithms', credits: 4, teacherIdx: 1 },
    { code: 'ENGMATH', name: 'Engineering Mathematics', credits: 3, teacherIdx: 2 },
    { code: 'PHY', name: 'Physics', credits: 3, teacherIdx: 2 },
  ];

  const papers = await Promise.all(
    paperData.map((p) =>
      Paper.create({
        code: p.code,
        name: p.name,
        credits: p.credits,
        semesterId: semester._id,
        teacherId: teachers[p.teacherIdx]._id,
      })
    )
  );

  console.log('✅ 5 papers with teacher assignments created');

  // ── Timetable ──────────────────────────────────────────────────────────────
  const timetableData = [
    // Monday
    { day: DayOfWeek.MONDAY, time: '09:00', end: '09:50', ofIdx: 0, tIdx: 0 }, // DBMS - Suresh
    { day: DayOfWeek.MONDAY, time: '10:00', end: '10:50', ofIdx: 1, tIdx: 0 }, // OS - Suresh
    { day: DayOfWeek.MONDAY, time: '11:00', end: '11:50', ofIdx: 2, tIdx: 1 }, // DSA - Meena
    // Tuesday
    { day: DayOfWeek.TUESDAY, time: '09:00', end: '09:50', ofIdx: 1, tIdx: 0 }, // OS - Suresh
    { day: DayOfWeek.TUESDAY, time: '10:00', end: '10:50', ofIdx: 2, tIdx: 1 }, // DSA - Meena
    { day: DayOfWeek.TUESDAY, time: '11:00', end: '11:50', ofIdx: 3, tIdx: 2 }, // Maths - Rajesh
    // Wednesday
    { day: DayOfWeek.WEDNESDAY, time: '09:00', end: '09:50', ofIdx: 4, tIdx: 2 }, // Physics - Rajesh
    { day: DayOfWeek.WEDNESDAY, time: '10:00', end: '10:50', ofIdx: 0, tIdx: 0 }, // DBMS - Suresh
    // Thursday
    { day: DayOfWeek.THURSDAY, time: '09:00', end: '09:50', ofIdx: 0, tIdx: 0 }, // DBMS - Suresh
    { day: DayOfWeek.THURSDAY, time: '10:00', end: '10:50', ofIdx: 3, tIdx: 2 }, // Maths - Rajesh
    // Friday
    { day: DayOfWeek.FRIDAY, time: '09:00', end: '09:50', ofIdx: 2, tIdx: 1 }, // DSA - Meena
    { day: DayOfWeek.FRIDAY, time: '10:00', end: '10:50', ofIdx: 4, tIdx: 2 }, // Physics - Rajesh
  ];

  await Promise.all(
    timetableData.map((t) =>
      TimetableEntry.create({
        semesterId: semester._id,
        paperId: papers[t.ofIdx]._id,
        teacherId: teachers[t.tIdx]._id,
        dayOfWeek: t.day,
        startTime: t.time,
        endTime: t.end,
      })
    )
  );
  console.log('✅ Timetable created (Mon–Fri)');

  console.log('\n🎉 Seed complete!');
  console.log('──────────────────────────────────────────');
  console.log('Login credentials:');
  console.log('  Admin:   admin@attendme.edu       / admin123');
  console.log('  Teacher: suresh@attendme.edu      / teacher123');
  console.log('  Teacher: meena@attendme.edu       / teacher123');
  console.log('  Teacher: rajesh@attendme.edu      / teacher123');
  console.log('  Student: ananya@student.attendme.edu / student123');
  console.log('  Student: rahul@student.attendme.edu  / student123');
  console.log('  ... (all students: password student123)');
  console.log('──────────────────────────────────────────');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
