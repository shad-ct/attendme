import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { DayOfWeek } from '@attendme/shared';

interface TimetableEntry {
  _id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  paperId: { name: string; code: string; semesterId?: { name: string; academicYear: string } };
  semesterId: { name: string; academicYear: string };
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

export default function TeacherTimetable() {
  const today = DAYS[new Date().getDay() - 1] ?? 'MONDAY';
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['teacher-timetable'],
    queryFn: () => api.get('/timetable/teacher').then((r) => r.data.data as TimetableEntry[]),
  });

  const byDay = DAYS.reduce((acc, day) => {
    acc[day] = entries.filter((e) => e.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
    return acc;
  }, {} as Record<string, TimetableEntry[]>);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-title-2">Timetable</h1>
      <p className="text-subhead -mt-4" style={{ color: 'var(--color-text-secondary)' }}>
        Week of {format(new Date(), 'd MMM yyyy')}
      </p>

      {isLoading && [1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-md" />)}

      {DAYS.map((day) => {
        const dayEntries = byDay[day] ?? [];
        const isToday = day === today;
        return (
          <div key={day}>
            <h2
              className="text-headline mb-2"
              style={{ color: isToday ? 'var(--color-accent)' : 'var(--color-text-primary)' }}
            >
              {day.charAt(0) + day.slice(1).toLowerCase()}
              {isToday && <span className="text-footnote ml-2" style={{ color: 'var(--color-accent)' }}>Today</span>}
            </h2>
            {dayEntries.length === 0 ? (
              <p className="text-subhead pl-1" style={{ color: 'var(--color-text-tertiary)' }}>No classes.</p>
            ) : (
              <div className="space-y-1.5">
                {dayEntries.map((e) => (
                  <div
                    key={e._id}
                    className="p-3 rounded-md flex items-center gap-3"
                    style={{
                      background: isToday ? 'var(--color-accent-muted)' : 'var(--color-surface)',
                      border: `1px solid ${isToday ? 'var(--color-accent)' : 'var(--color-separator)'}`,
                    }}
                  >
                    <span className="text-footnote tabular-nums font-medium" style={{ color: 'var(--color-text-secondary)', minWidth: 80 }}>
                      {e.startTime}–{e.endTime}
                    </span>
                    <div>
                      <p className="text-callout font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {e.paperId?.name}
                      </p>
                      <p className="text-footnote" style={{ color: 'var(--color-text-secondary)' }}>
                        {e.paperId?.semesterId?.name ?? e.semesterId?.name}
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
