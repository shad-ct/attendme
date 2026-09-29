import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Role } from '@attendme/shared';

// Pages
import LoginPage from './pages/auth/LoginPage';

// Admin
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/users/AdminUsers';
import AdminCourses from './pages/admin/courses/AdminCourses';
import AdminPapers from './pages/admin/papers/AdminPapers';
import AdminTimetable from './pages/admin/timetable/AdminTimetable';
import AdminAttendance from './pages/admin/attendance/AdminAttendance';
import AdminAuditLog from './pages/admin/audit/AdminAuditLog';

// Teacher
import TeacherLayout from './pages/teacher/TeacherLayout';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherClasses from './pages/teacher/TeacherClasses';
import TeacherClassDetail from './pages/teacher/TeacherClassDetail';
import TeacherStudentView from './pages/teacher/TeacherStudentView';
import TeacherAttendance from './pages/teacher/attendance/TeacherAttendance';
import TeacherAssessments from './pages/teacher/assessments/TeacherAssessments';
import TeacherMarks from './pages/teacher/marks/TeacherMarks';
import TeacherTimetable from './pages/teacher/TeacherTimetable';
import TeacherNotifications from './pages/teacher/TeacherNotifications';

// Student
import StudentLayout from './pages/student/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentAttendance from './pages/student/attendance/StudentAttendance';
import StudentAcademics from './pages/student/academics/StudentAcademics';
import StudentTimetable from './pages/student/StudentTimetable';
import StudentNotifications from './pages/student/StudentNotifications';
import StudentProfile from './pages/student/StudentProfile';

function RoleRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-background)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-accent animate-spin border-t-transparent" style={{ borderColor: 'var(--color-separator)', borderTopColor: 'var(--color-accent)' }} />
          <p className="text-subhead" style={{ color: 'var(--color-text-secondary)' }}>Loading AttendMe…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === Role.ADMIN) return <Navigate to="/admin" replace />;
  if (user.role === Role.TEACHER) return <Navigate to="/teacher" replace />;
  return <Navigate to="/student" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RoleRouter />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="papers" element={<AdminPapers />} />
            <Route path="timetable" element={<AdminTimetable />} />
            <Route path="attendance" element={<AdminAttendance />} />
            <Route path="audit" element={<AdminAuditLog />} />
          </Route>

          {/* Teacher */}
          <Route path="/teacher" element={<TeacherLayout />}>
            <Route index element={<TeacherDashboard />} />
            <Route path="classes" element={<TeacherClasses />} />
            <Route path="classes/:semesterId" element={<TeacherClassDetail />} />
            <Route path="classes/:semesterId/student/:studentId" element={<TeacherStudentView />} />
            <Route path="timetable" element={<TeacherTimetable />} />
            <Route path="attendance/:sessionId" element={<TeacherAttendance />} />
            <Route path="assessments" element={<TeacherAssessments />} />
            <Route path="assessments/:assessmentId/marks" element={<TeacherMarks />} />
            <Route path="notifications" element={<TeacherNotifications />} />
          </Route>

          {/* Student */}
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<StudentDashboard />} />
            <Route path="timetable" element={<StudentTimetable />} />
            <Route path="attendance" element={<StudentAttendance />} />
            <Route path="academics" element={<StudentAcademics />} />
            <Route path="notifications" element={<StudentNotifications />} />
            <Route path="profile" element={<StudentProfile />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
