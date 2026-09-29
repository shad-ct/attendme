import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { Bell, CheckCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { NotificationType } from '@attendme/shared';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
}

const NOTIF_ICONS: Record<string, string> = {
  [NotificationType.NEW_ASSIGNMENT]: '📋',
  [NotificationType.NEW_EXAM]: '📝',
  [NotificationType.TIMETABLE_CHANGE]: '🗓',
  [NotificationType.MARKS_PUBLISHED]: '📊',
  [NotificationType.ANNOUNCEMENT]: '📢',
  [NotificationType.ATTENDANCE_WARNING]: '⚠️',
};

export default function StudentNotifications() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['student-notifications'],
    queryFn: () => api.get('/notifications?limit=50').then((r) => r.data),
  });

  const readAllMutation = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => {
      toast.success('All marked as read.');
      qc.invalidateQueries({ queryKey: ['student-notifications'] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['student-notifications'] }),
  });

  const notifications: Notification[] = data?.data ?? [];
  const unreadCount: number = data?.meta?.unreadCount ?? 0;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-title-2">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 text-callout font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--color-accent)', color: '#fff' }}>
              {unreadCount}
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={() => readAllMutation.mutate()}
            className="flex items-center gap-1.5 text-subhead"
            style={{ color: 'var(--color-accent)' }}
          >
            <CheckCheck size={16} />
            Mark all read
          </button>
        )}
      </div>

      {isLoading && [1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-16 rounded-md" />)}

      {notifications.length === 0 && !isLoading && (
        <div className="text-center py-16" style={{ color: 'var(--color-text-secondary)' }}>
          <Bell size={32} className="mx-auto mb-3" />
          <p className="text-headline">No notifications yet.</p>
          <p className="text-subhead mt-1">You're all caught up.</p>
        </div>
      )}

      <div className="rounded-md overflow-hidden" style={{ border: notifications.length ? '1px solid var(--color-separator)' : 'none' }}>
        {notifications.map((n, idx) => (
          <button
            key={n._id}
            onClick={() => !n.readAt && markReadMutation.mutate(n._id)}
            className="w-full text-left p-4 flex gap-3 transition-colors"
            style={{
              background: n.readAt ? 'var(--color-surface)' : 'var(--color-accent-muted)',
              borderTop: idx > 0 ? '1px solid var(--color-separator)' : undefined,
            }}
          >
            <span className="text-lg flex-shrink-0 mt-0.5">{NOTIF_ICONS[n.type] ?? '🔔'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-callout font-semibold leading-snug" style={{ color: 'var(--color-text-primary)' }}>{n.title}</p>
                {!n.readAt && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: 'var(--color-accent)' }} />}
              </div>
              <p className="text-subhead mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{n.message}</p>
              <p className="text-caption mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                {format(new Date(n.createdAt), 'd MMM · HH:mm')}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
