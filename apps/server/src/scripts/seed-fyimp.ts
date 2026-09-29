import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Role } from '@attendme/shared';
import { User } from '../modules/users/user.model';
import { TeacherProfile, StudentProfile } from '../modules/users/profile.model';
import { Course, Semester, StudentSemesterMembership } from '../modules/courses/course.model';
import { Paper } from '../modules/papers/paper.model';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/attendme';

const teachers = [
  { name: 'sreekala pola', email: 'sreekala@attendme.edu' },
  { name: 'newteacher', email: 'newteacher@attendme.edu' },
  { name: 'arunodhaya', email: 'arunodhaya@attendme.edu' },
  { name: 'Athulya', email: 'athulya@attendme.edu' },
  { name: 'reema', email: 'reema@attendme.edu' },
  { name: 'shyma', email: 'shyma@attendme.edu' },
  { name: 'Dr. Suresh Kumar', email: 'suresh@attendme.edu' },
];

const papersData = [
  { code: 'S5_JAVA', name: 'KU5DSCCSE302 Java Technologies', teacherName: 'sreekala pola' },
  { code: 'S5_SE', name: 'KU5DSCCSE304 Software Engineering', teacherName: 'newteacher' },
  { code: 'S5_ML', name: 'KU5DSCCSE305 Machine Learning Techniques', teacherName: 'arunodhaya' },
  { code: 'S5_CN', name: 'KU5DSCCSE303 COMPUTER NETWORK', teacherName: 'Athulya' },
  { code: 'S5_PY', name: 'KU5SECCSE204 Data Processing with Python', teacherName: 'reema' },
  { code: 'S5_CLOUD', name: 'KU5DSECSE309 CLOUD, EDGE AND FOG COMPUTING', teacherName: 'shyma' },
];

const students = [
  'Muhammed Shad C T',
  'shaza jabbar',
  'Mohammed Lamih M V',
  'Havana A',
  'Devika V',
  'Abhishek Sukumaran K',
  'Devang Rajeev',
  'Muhammad Sahal M',
  'Achyuth Prathap',
  'Arjun k',
  'Fathimath Sherin BT',
  'NAVEENSURESAN AV',
  'Vismaya v v',
  'FAYHAA FATHIMA AV',
  'Sreenanda E',
  'Krishnendu PT',
  'Devika Surendran',
  'Sreedeep Pradeep',
  'Muhammad Juhail k',
  'Nandha kishore k',
  'Vishnu L',
  'Rohith V Nair',
  'Sreehari A E',
  'Safwan mp',
  'Fathimathul Fadiya',
  'Dhrupath V P',
  'Prinsha Pradeep',
  'Aman C',
  'Ananya Nair',
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');

  await mongoose.connection.db?.dropDatabase();
  console.log('Cleared existing database.');

  const passwordHash = await bcrypt.hash('password123', 12);

  // 0. Create Admin
  const adminUser = await User.create({
    name: 'Admin',
    email: 'admin@attendme.edu',
    passwordHash: await bcrypt.hash('admin123', 12),
    role: Role.ADMIN,
  });
  console.log('✅ Admin created: admin@attendme.edu / admin123');

  // 1. Create or get Course
  let course = await Course.findOne({ name: 'FYIMP CS' });
  if (!course) {
    course = await Course.create({ name: 'FYIMP CS', code: 'FYIMPCS', description: 'Five Year Integrated Master of Computer Applications' });
    console.log('Created course FYIMP CS');
  }

  // 2. Create or get Semester
  let semester = await Semester.findOne({ courseId: course._id, sequence: 5 });
  if (!semester) {
    semester = await Semester.create({
      courseId: course._id,
      name: 'Semester 5',
      academicYear: '2024-2025',
      sequence: 5,
    });
    console.log('Created Semester 5');
  }

  // 3. Create Teachers
  const teacherDocs: Record<string, any> = {};
  for (const t of teachers) {
    let user = await User.findOne({ email: t.email });
    if (!user) {
      user = await User.create({
        name: t.name,
        email: t.email,
        passwordHash,
        role: Role.TEACHER,
      });
      await TeacherProfile.create({ userId: user._id, employeeId: `EMP-${Date.now().toString().slice(-4)}` });
      console.log(`Created teacher ${t.name}`);
    }
    teacherDocs[t.name] = user;
  }

  // 4. Create Papers
  for (const p of papersData) {
    let paper = await Paper.findOne({ code: p.code, semesterId: semester._id });
    if (!paper) {
      paper = await Paper.create({
        code: p.code,
        name: p.name,
        credits: 4,
        semesterId: semester._id,
        teacherId: teacherDocs[p.teacherName]._id,
      });
      console.log(`Created paper ${p.code}`);
    } else {
        await Paper.updateOne({ _id: paper._id }, { teacherId: teacherDocs[p.teacherName]._id });
        console.log(`Updated paper ${p.code}`);
    }
  }

  // 5. Create Students and Enroll them
  let counter = 1;
  for (const sName of students) {
    const email = `${sName.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.attendme.edu`;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: sName,
        email,
        passwordHash,
        role: Role.STUDENT,
      });
      await StudentProfile.create({
        userId: user._id,
        studentId: `STU-${Date.now().toString().slice(-6)}${counter}`,
        currentSemesterId: semester._id,
      });
      
      await StudentSemesterMembership.create({
        studentId: user._id,
        semesterId: semester._id,
        startDate: new Date(),
        isCurrent: true,
      });
      
      console.log(`Created student ${sName}`);
    } else {
       // ensure membership exists
       const mem = await StudentSemesterMembership.findOne({ studentId: user._id, semesterId: semester._id });
       if (!mem) {
          await StudentSemesterMembership.create({
            studentId: user._id,
            semesterId: semester._id,
            startDate: new Date(),
            isCurrent: true,
          });
       }
    }
    counter++;
  }

  console.log('Done!');
  process.exit(0);
}

seed().catch(console.error);
