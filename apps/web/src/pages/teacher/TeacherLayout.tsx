import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home, BookOpen, Clock, CalendarCheck, BarChart2, Megaphone, LogOut, User,
} from 'lucide-react';

const navItems = [
  { to: '/teacher', icon: Home, label: 'Home', end: true },
  { to: '/teacher/classes', icon: BookOpen, label: 'Classes' },
  { to: '/teacher/timetable', icon: Clock, label: 'Timetable' },
  { to: '/teacher/assessments', icon: BarChart2, label: 'Assessments' },
  { to: '/teacher/notifications', icon: Megaphone, label: 'Notifications' },
];

export default function TeacherLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-background)' }}>
      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-separator)' }}>
        <span className="text-headline font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          attend<span style={{ color: 'var(--color-accent)' }}>me</span>
        </span>
        <div className="flex items-center gap-2">
          <span className="text-subhead" style={{ color: 'var(--color-text-secondary)' }}>{user?.name}</span>
          <button onClick={handleLogout} className="p-2 rounded-md" style={{ color: 'var(--color-text-secondary)' }}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20 lg:pb-0 lg:ml-0">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex border-t" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-separator)', backdropFilter: 'blur(20px)' }}>
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-1"
            style={({ isActive }) => ({
              color: isActive ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
              fontSize: '10px',
              fontWeight: isActive ? 600 : 400,
            })}
          >
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-1"
          style={{ color: 'var(--color-text-tertiary)', fontSize: '10px' }}
        >
          <LogOut size={22} />
          <span>Logout</span>
        </button>
      </nav>
    </div>
  );
}
