import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { BookOpen, CalendarCheck, FileText } from 'lucide-react';

interface Assessment {
  _id: string;
  title: string;
  type: string;
  maxMarks: number;
  date?: string;
  status: string;
  myMark: number | null;
  paperId: { name: string; code: string };
}

export default function StudentAcademics() {
  const { data: assessments = [], isLoading } = useQuery<Assessment[]>({
    queryKey: ['student-assessments'],
    queryFn: () => api.get('/assessments/student').then((r) => r.data.data),
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['student-events'],
    queryFn: () => api.get('/events/student').then((r) => r.data.data),
  });

  // Group assessments by paper
  const byPaper = assessments.reduce((acc, a) => {
    const key = a.paperId?.code ?? 'Other';
    if (!acc[key]) acc[key] = { name: a.paperId?.name ?? 'Other', items: [] };
    acc[key].items.push(a);
    return acc;
  }, {} as Record<string, { name: string; items: Assessment[] }>);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-title-2">Academics</h1>

      {/* Marks */}
      <section>
        <h2 className="text-headline mb-3">Marks & CE</h2>
        {isLoading && [1, 2].map((i) => <div key={i} className="skeleton h-24 rounded-md mb-2" />)}
        {Object.keys(byPaper).length === 0 && !isLoading && (
          <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
            <BookOpen size={28} className="mx-auto mb-2" />
            <p className="text-headline">No published marks yet.</p>
            <p className="text-subhead mt-1">Marks appear here once your teacher publishes them.</p>
          </div>
        )}
        {Object.entries(byPaper).map(([code, { name, items }]) => (
          <div key={code} className="mb-4">
            <p className="text-callout font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              {code} — {name}
            </p>
            <div className="rounded-md overflow-hidden" style={{ border: '1px solid var(--color-separator)' }}>
              {items.map((a, idx) => (
                <div
                  key={a._id}
                  className="p-3 flex items-center justify-between gap-3"
                  style={{ background: 'var(--color-surface)', borderTop: idx > 0 ? '1px solid var(--color-separator)' : undefined }}
                >
                  <div>
                    <p className="text-callout font-medium" style={{ color: 'var(--color-text-primary)' }}>{a.title}</p>
                    <p className="text-footnote" style={{ color: 'var(--color-text-tertiary)' }}>
                      {a.type}{a.date ? ` · ${format(new Date(a.date), 'd MMM')}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    {a.myMark !== null ? (
                      <>
                        <p className="text-headline tabular-nums font-bold" style={{ color: 'var(--color-text-primary)' }}>
                          {a.myMark}
                          <span className="text-footnote font-normal" style={{ color: 'var(--color-text-tertiary)' }}>/{a.maxMarks}</span>
                        </p>
                        <p className="text-caption tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
                          {Math.round((a.myMark / a.maxMarks) * 100)}%
                        </p>
                      </>
                    ) : (
                      <p className="text-footnote" style={{ color: 'var(--color-text-tertiary)' }}>Pending</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Upcoming events */}
      <section>
        <h2 className="text-headline mb-3">Upcoming</h2>
        {eventsLoading && [1, 2].map((i) => <div key={i} className="skeleton h-16 rounded-md mb-2" />)}
        {events.length === 0 && !eventsLoading && (
          <p className="text-subhead" style={{ color: 'var(--color-text-tertiary)' }}>Nothing scheduled.</p>
        )}
        <div className="space-y-1.5">
          {events.map((e: any) => (
            <div
              key={e._id}
              className="p-3 rounded-md flex items-center gap-3"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-separator)' }}
            >
              <FileText size={16} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <p className="text-callout font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{e.title}</p>
                <p className="text-footnote" style={{ color: 'var(--color-text-secondary)' }}>
                  {e.type}{e.dueDate ? ` · Due ${format(new Date(e.dueDate), 'd MMM yyyy')}` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
