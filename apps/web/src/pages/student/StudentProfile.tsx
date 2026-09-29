import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Hash, LogOut } from 'lucide-react';

export default function StudentProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ['student-me'],
    queryFn: () => api.get('/auth/me').then((r) => r.data.data),
  });

  const profile = data?.profile;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-title-2">Profile</h1>

      {/* Avatar + name */}
      <div className="flex flex-col items-center py-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-title-2 font-bold" style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <p className="text-title-3 mt-3">{user?.name}</p>
        <p className="text-subhead" style={{ color: 'var(--color-text-secondary)' }}>{user?.role}</p>
      </div>

      {/* Details */}
      <div className="rounded-md overflow-hidden" style={{ border: '1px solid var(--color-separator)' }}>
        {[
          { icon: User, label: 'Full Name', value: user?.name },
          { icon: Mail, label: 'Email', value: user?.email },
          { icon: Hash, label: 'Student ID', value: profile?.studentId ?? '—' },
        ].map(({ icon: Icon, label, value }, idx) => (
          <div
            key={label}
            className="p-4 flex items-center gap-3"
            style={{ background: 'var(--color-surface)', borderTop: idx > 0 ? '1px solid var(--color-separator)' : undefined }}
          >
            <Icon size={18} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
            <div>
              <p className="text-footnote" style={{ color: 'var(--color-text-tertiary)' }}>{label}</p>
              <p className="text-callout font-medium" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full p-4 rounded-md flex items-center gap-3 text-left"
        style={{ background: 'var(--color-danger-muted)', border: '1px solid var(--color-danger)', color: 'var(--color-danger-text)' }}
      >
        <LogOut size={18} />
        <span className="text-callout font-medium">Sign out</span>
      </button>
    </div>
  );
}
