import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Home, Clock, BarChart2, BookOpen, Bell, User, LogOut } from 'lucide-react';

const navItems = [
  { to: '/student', icon: Home, label: 'Home', end: true },
  { to: '/student/timetable', icon: Clock, label: 'Timetable' },
  { to: '/student/attendance', icon: BarChart2, label: 'Attendance' },
  { to: '/student/academics', icon: BookOpen, label: 'Academics' },
  { to: '/student/notifications', icon: Bell, label: 'Notifications' },
  { to: '/student/profile', icon: User, label: 'Profile' },
];

export default function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-background)' }}>
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-separator)' }}>
        <span className="text-headline font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          attend<span style={{ color: 'var(--color-accent)' }}>me</span>
        </span>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="p-2"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 pb-24">
        <div className="max-w-lg mx-auto px-4 py-5">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-40 flex border-t" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-separator)', backdropFilter: 'blur(20px)' }}>
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5"
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
      </nav>
    </div>
  );
}
