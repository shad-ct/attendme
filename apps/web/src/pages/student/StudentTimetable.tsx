import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import { DayOfWeek } from '@attendme/shared';

const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export default function StudentTimetable() {
  const todayIdx = new Date().getDay();
  const today = DAYS[todayIdx];

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['student-timetable'],
    queryFn: () => api.get('/timetable/classes/student').then((r) => r.data.data ?? []),
  });

  const weekdays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  const byDay = weekdays.reduce((acc, day) => {
    acc[day] = entries.filter((e: any) => e.dayOfWeek === day).sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-title-2">Timetable</h1>
      <p className="text-subhead -mt-3" style={{ color: 'var(--color-text-secondary)' }}>
        Week of {format(new Date(), 'd MMM yyyy')}
      </p>

      {isLoading && [1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-md" />)}

      {weekdays.map((day) => {
        const isToday = day === today;
        const dayEntries = byDay[day] ?? [];
        return (
          <div key={day}>
            <h2
              className="text-headline mb-2 flex items-center gap-2"
              style={{ color: isToday ? 'var(--color-accent)' : 'var(--color-text-primary)' }}
            >
              {day.charAt(0) + day.slice(1).toLowerCase()}
              {isToday && <span className="text-caption font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}>Today</span>}
            </h2>
            {dayEntries.length === 0 ? (
              <p className="text-subhead pl-1" style={{ color: 'var(--color-text-tertiary)' }}>No classes.</p>
            ) : (
              <div className="space-y-1.5">
                {dayEntries.map((e: any) => (
                  <div
                    key={e._id}
                    className="p-3 rounded-md flex items-start gap-3"
                    style={{
                      background: isToday ? 'var(--color-accent-muted)' : 'var(--color-surface)',
                      border: `1px solid ${isToday ? 'var(--color-accent)' : 'var(--color-separator)'}`,
                    }}
                  >
                    <div className="flex-shrink-0 pt-0.5">
                      <Clock size={14} style={{ color: isToday ? 'var(--color-accent)' : 'var(--color-text-tertiary)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-callout font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {e.paperId?.name}
                      </p>
                      <p className="text-footnote tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
                        {e.startTime}–{e.endTime}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
