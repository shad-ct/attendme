import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { format, isToday, isFuture } from 'date-fns';
import { Clock, BarChart2, CalendarClock, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = DAYS[new Date().getDay()];

  const { data: timetable = [] } = useQuery({
    queryKey: ['student-timetable'],
    queryFn: () => api.get('/timetable/classes/student').then((r) => r.data.data ?? []),
  });

  const { data: attendance } = useQuery({
    queryKey: ['student-attendance-summary'],
    queryFn: () => api.get('/attendance/student/summary').then((r) => r.data.data),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['student-events'],
    queryFn: () => api.get('/events/student').then((r) => r.data.data ?? []),
  });

  const { data: notifData } = useQuery({
    queryKey: ['student-notifications'],
    queryFn: () => api.get('/notifications?limit=5').then((r) => r.data),
  });

  const todayClasses = timetable
    .filter((e: any) => e.dayOfWeek === today)
    .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));

  const now = format(new Date(), 'HH:mm');
  const nextClass = todayClasses.find((e: any) => e.startTime >= now);

  const upcomingEvents = events
    .filter((e: any) => e.dueDate && isFuture(new Date(e.dueDate)))
    .slice(0, 3);

  const unread = notifData?.meta?.unreadCount ?? 0;

  const pct = attendance?.overallPercentage ?? null;
  const pctColor = pct === null ? 'var(--color-text-tertiary)' : pct >= 75 ? 'var(--color-success)' : pct >= 60 ? 'var(--color-warning)' : 'var(--color-danger)';
  const pctLabel = pct === null ? '—' : pct >= 75 ? 'On track' : pct >= 60 ? 'Borderline' : 'Low';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div>
        <p className="text-subhead" style={{ color: 'var(--color-text-secondary)' }}>
          {format(new Date(), 'EEEE, d MMMM')}
        </p>
        <h1 className="text-title-1">
          Hi, {user?.name?.split(' ')[0]}.
        </h1>
      </div>

      {/* Next class hero */}
      {nextClass ? (
        <div
          className="p-4 rounded-lg"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-separator)' }}
        >
          <p className="text-footnote mb-1" style={{ color: 'var(--color-text-tertiary)' }}>Next class</p>
          <p className="text-title-3">{nextClass.paperId?.name}</p>
          <p className="text-subhead mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {nextClass.startTime}–{nextClass.endTime}
          </p>
        </div>
      ) : (
        <div className="p-4 rounded-lg" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-separator)' }}>
          <div className="flex items-center gap-2">
            <Clock size={18} style={{ color: 'var(--color-text-tertiary)' }} />
            <p className="text-callout" style={{ color: 'var(--color-text-secondary)' }}>
              {todayClasses.length === 0 ? 'No classes today.' : 'All done for today.'}
            </p>
          </div>
        </div>
      )}

      {/* Attendance at a glance */}
      <button
        onClick={() => navigate('/student/attendance')}
        className="w-full p-4 rounded-lg flex items-center justify-between gap-4 text-left"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-separator)' }}
      >
        <div>
          <p className="text-footnote mb-1" style={{ color: 'var(--color-text-tertiary)' }}>Attendance</p>
          <p className="text-title-2 tabular-nums font-bold" style={{ color: pctColor }}>
            {pct !== null ? `${pct}%` : '—'}
          </p>
          <p className="text-subhead" style={{ color: pctColor }}>{pctLabel}</p>
        </div>
        <BarChart2 size={28} style={{ color: pctColor, flexShrink: 0 }} />
      </button>

      {/* Upcoming */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-headline">Upcoming</h2>
          <button onClick={() => navigate('/student/academics')} className="text-subhead" style={{ color: 'var(--color-accent)' }}>See all</button>
        </div>
        {upcomingEvents.length === 0 ? (
          <p className="text-subhead" style={{ color: 'var(--color-text-tertiary)' }}>Nothing coming up.</p>
        ) : (
          <div className="space-y-1.5">
            {upcomingEvents.map((e: any) => (
              <div
                key={e._id}
                className="p-3 rounded-md flex items-center gap-3"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-separator)' }}
              >
                <CalendarClock size={16} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <p className="text-callout font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{e.title}</p>
                  <p className="text-footnote" style={{ color: 'var(--color-text-secondary)' }}>
                    Due {format(new Date(e.dueDate), 'd MMM')}
                  </p>
                </div>
                <span className="text-caption-2 font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}>
                  {e.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Notifications badge */}
      {unread > 0 && (
        <button
          onClick={() => navigate('/student/notifications')}
          className="w-full p-3 rounded-md flex items-center gap-3"
          style={{ background: 'var(--color-accent-muted)', border: '1px solid var(--color-accent)' }}
        >
          <Bell size={18} style={{ color: 'var(--color-accent)' }} />
          <p className="text-callout font-medium" style={{ color: 'var(--color-accent)' }}>
            {unread} unread notification{unread !== 1 ? 's' : ''}
          </p>
        </button>
      )}
    </div>
  );
}
