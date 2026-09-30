import { Outlet, NavLink, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Home, Clock, BarChart2, BookOpen, Bell, User, LogOut } from 'lucide-react';

export default function StudentLayout() {
  const { user, logout } = useAuth();

  // Fetch unread notification count
  const { data: notifData } = useQuery({
    queryKey: ['student-notifications-unread'],
    queryFn: () => api.get('/notifications?limit=1').then((r) => r.data),
    refetchInterval: 30_000, // poll every 30s
  });
  const unreadCount: number = notifData?.meta?.unreadCount ?? 0;

  if (!user) return <Navigate to="/login" replace />;

  const navItems = [
    { to: '/student', icon: Home, label: 'Home', end: true },
    { to: '/student/timetable', icon: Clock, label: 'Timetable' },
    { to: '/student/attendance', icon: BarChart2, label: 'Attendance' },
    { to: '/student/academics', icon: BookOpen, label: 'Academics' },
    { to: '/student/notifications', icon: Bell, label: 'Alerts', badge: unreadCount },
    { to: '/student/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-background)' }}>
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-separator)' }}>
        <span className="text-headline font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          attend<span style={{ color: 'var(--color-accent)' }}>me</span>
        </span>
        <div className="flex items-center gap-2">
          {/* Header notification bell with pulse */}
          <NavLink to="/student/notifications" className="relative p-2" style={{ color: 'var(--color-text-tertiary)' }}>
            <Bell size={20} />
            {unreadCount > 0 && (
              <>
                {/* pulsing ring */}
                <span
                  className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full animate-ping"
                  style={{ background: 'var(--color-accent)', opacity: 0.6 }}
                />
                {/* solid dot with count */}
                <span
                  className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ background: 'var(--color-accent)' }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </>
            )}
          </NavLink>
          <button
            onClick={logout}
            className="p-2"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 pb-24">
        <div className="max-w-lg mx-auto px-4 py-5">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-40 flex border-t" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-separator)', backdropFilter: 'blur(20px)' }}>
        {navItems.map(({ to, icon: Icon, label, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative"
            style={({ isActive }) => ({
              color: isActive ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
              fontSize: '10px',
              fontWeight: isActive ? 600 : 400,
            })}
          >
            <span className="relative">
              <Icon size={22} />
              {badge && badge > 0 && (
                <>
                  {/* subtle pulse on the nav icon */}
                  <span
                    className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-ping"
                    style={{ background: 'var(--color-accent)', opacity: 0.7 }}
                  />
                  <span
                    className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 px-0.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                    style={{ background: 'var(--color-accent)' }}
                  >
                    {badge > 9 ? '9+' : badge}
                  </span>
                </>
              )}
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
