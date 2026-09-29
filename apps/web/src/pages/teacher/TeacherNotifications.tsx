import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Megaphone, Bell, Check, Send } from 'lucide-react';
import { format } from 'date-fns';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
}

interface ClassItem {
  _id: string;
  name: string;
  academicYear: string;
}

export default function TeacherNotifications() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'inbox' | 'announce'>('inbox');
  const [announceForm, setAnnounceForm] = useState({ semesterId: '', title: '', message: '' });

  const { data: notifsData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data),
  });

  const { data: classesData } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: () => api.get('/teacher/classes').then((r) => r.data.data as ClassItem[]),
  });

  const readMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const announceMutation = useMutation({
    mutationFn: () => api.post('/notifications/announce', announceForm),
    onSuccess: () => {
      toast.success('Announcement broadcasted.');
      setAnnounceForm({ semesterId: '', title: '', message: '' });
      setActiveTab('inbox');
    },
    onError: () => toast.error('Failed to send announcement.'),
  });

  const notifications: Notification[] = notifsData?.data || [];

  return (
    <div className="space-y-6 animate-fade-in pb-20 lg:pb-8">
      {/* Header & Tabs */}
      <div>
        <h1 className="text-title-2 mb-4" style={{ color: 'var(--color-text-primary)' }}>Notifications</h1>
        <div className="flex bg-neutral-muted p-1 rounded-md" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-separator)' }}>
          <button
            onClick={() => setActiveTab('inbox')}
            className="flex-1 py-1.5 text-footnote font-medium rounded transition-colors flex items-center justify-center gap-2"
            style={{
              background: activeTab === 'inbox' ? 'var(--color-background)' : 'transparent',
              color: activeTab === 'inbox' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              boxShadow: activeTab === 'inbox' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <Bell size={16} /> Inbox
          </button>
          <button
            onClick={() => setActiveTab('announce')}
            className="flex-1 py-1.5 text-footnote font-medium rounded transition-colors flex items-center justify-center gap-2"
            style={{
              background: activeTab === 'announce' ? 'var(--color-background)' : 'transparent',
              color: activeTab === 'announce' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              boxShadow: activeTab === 'announce' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            <Megaphone size={16} /> Broadcast
          </button>
        </div>
      </div>

      {/* Inbox Tab */}
      {activeTab === 'inbox' && (
        <div className="space-y-2">
          {isLoading && [1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-md" />)}

          {!isLoading && notifications.length === 0 && (
            <div className="text-center py-12" style={{ color: 'var(--color-text-secondary)' }}>
              <Bell size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-headline">No notifications</p>
              <p className="text-subhead mt-1">You're all caught up.</p>
            </div>
          )}

          {notifications.map((n) => (
            <div
              key={n._id}
              className="p-4 rounded-md flex gap-4 transition-all"
              style={{
                background: n.readAt ? 'transparent' : 'var(--color-surface)',
                border: `1px solid ${n.readAt ? 'transparent' : 'var(--color-separator)'}`,
                borderBottom: n.readAt ? '1px solid var(--color-separator)' : undefined,
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
              >
                <Bell size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-callout font-semibold" style={{ color: 'var(--color-text-primary)' }}>{n.title}</p>
                <p className="text-subhead mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{n.message}</p>
                <p className="text-caption mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                  {format(new Date(n.createdAt), 'MMM d, h:mm a')}
                </p>
              </div>
              {!n.readAt && (
                <button
                  onClick={() => readMutation.mutate(n._id)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-neutral-muted transition-colors flex-shrink-0"
                  style={{ color: 'var(--color-text-tertiary)' }}
                  aria-label="Mark as read"
                >
                  <Check size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Broadcast Tab */}
      {activeTab === 'announce' && (
        <div className="space-y-4 p-4 rounded-md animate-slide-up" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-separator)' }}>
          <div>
            <label className="text-subhead block mb-1 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Target Class</label>
            <select
              className="w-full px-3 py-2 rounded-md text-callout outline-none"
              style={{ background: 'var(--color-background)', border: '1px solid var(--color-separator)', color: 'var(--color-text-primary)' }}
              value={announceForm.semesterId}
              onChange={(e) => setAnnounceForm(p => ({ ...p, semesterId: e.target.value }))}
            >
              <option value="" disabled>Select a class...</option>
              {classesData?.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-subhead block mb-1 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Title</label>
            <input
              className="w-full px-3 py-2 rounded-md text-callout outline-none"
              style={{ background: 'var(--color-background)', border: '1px solid var(--color-separator)', color: 'var(--color-text-primary)' }}
              placeholder="e.g. Class Rescheduled"
              value={announceForm.title}
              onChange={(e) => setAnnounceForm(p => ({ ...p, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-subhead block mb-1 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Message</label>
            <textarea
              className="w-full px-3 py-2 rounded-md text-callout outline-none resize-none"
              rows={4}
              style={{ background: 'var(--color-background)', border: '1px solid var(--color-separator)', color: 'var(--color-text-primary)' }}
              placeholder="Type your message here..."
              value={announceForm.message}
              onChange={(e) => setAnnounceForm(p => ({ ...p, message: e.target.value }))}
            />
          </div>
          <button
            onClick={() => announceMutation.mutate()}
            disabled={!announceForm.semesterId || !announceForm.title || !announceForm.message || announceMutation.isPending}
            className="w-full py-2.5 rounded-md text-callout font-semibold flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
          >
            <Send size={18} />
            {announceMutation.isPending ? 'Sending...' : 'Broadcast Announcement'}
          </button>
        </div>
      )}
    </div>
  );
}
