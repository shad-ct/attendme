import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { BarChart2, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';

interface PaperAttendance {
  paperId: string;
  paperName: string;
  paperCode: string;
  present: number;
  total: number;
  percentage: number;
}

interface Summary {
  overallPercentage: number;
  totalPresent: number;
  totalSessions: number;
  papers: PaperAttendance[];
}

function AttendanceBar({ percentage }: { percentage: number }) {
  const color = percentage >= 75 ? 'var(--color-success)' : percentage >= 60 ? 'var(--color-warning)' : 'var(--color-danger)';
  return (
    <div className="h-1.5 rounded-full" style={{ background: 'var(--color-separator)' }}>
      <div
        className="h-1.5 rounded-full transition-all"
        style={{ width: `${Math.min(percentage, 100)}%`, background: color }}
      />
    </div>
  );
}

function statusIcon(pct: number) {
  if (pct >= 75) return <CheckCircle size={16} style={{ color: 'var(--color-success)' }} />;
  if (pct >= 60) return <AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} />;
  return <TrendingDown size={16} style={{ color: 'var(--color-danger)' }} />;
}

export default function StudentAttendance() {
  const { data, isLoading, error } = useQuery<Summary>({
    queryKey: ['student-attendance-summary'],
    queryFn: () => api.get('/attendance/student/summary').then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="skeleton h-32 rounded-lg" />
        {[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-md" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--color-danger)' }}>
        <p className="text-headline">Could not load attendance.</p>
        <p className="text-subhead mt-1" style={{ color: 'var(--color-text-secondary)' }}>Check your connection and try again.</p>
      </div>
    );
  }

  const pct = data?.overallPercentage ?? 0;
  const pctColor = pct >= 75 ? 'var(--color-success)' : pct >= 60 ? 'var(--color-warning)' : 'var(--color-danger)';
  const pctLabel = pct >= 75 ? 'On track' : pct >= 60 ? 'Borderline — be careful.' : 'Low — take action.';

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-title-2">Attendance</h1>

      {/* Overall hero */}
      <div className="p-5 rounded-lg" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-separator)' }}>
        <p className="text-subhead mb-1" style={{ color: 'var(--color-text-secondary)' }}>Overall</p>
        <div className="flex items-end gap-3">
          <p className="text-large-title tabular-nums font-bold" style={{ color: pctColor }}>{pct}%</p>
          <p className="text-headline mb-1" style={{ color: pctColor }}>{pctLabel}</p>
        </div>
        <p className="text-footnote mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
          {data?.totalPresent ?? 0} attended of {data?.totalSessions ?? 0} total sessions
        </p>
        <div className="mt-3">
          <AttendanceBar percentage={pct} />
        </div>
      </div>

      {/* Per paper */}
      <h2 className="text-headline">By Paper</h2>
      <div className="rounded-md overflow-hidden" style={{ border: '1px solid var(--color-separator)' }}>
        {(data?.papers ?? []).length === 0 && (
          <div className="p-8 text-center">
            <BarChart2 size={28} className="mx-auto mb-2" style={{ color: 'var(--color-text-tertiary)' }} />
            <p className="text-headline" style={{ color: 'var(--color-text-primary)' }}>No attendance recorded yet.</p>
            <p className="text-subhead mt-1" style={{ color: 'var(--color-text-secondary)' }}>Check back after your first session.</p>
          </div>
        )}
        {(data?.papers ?? []).map((s, idx) => {
          const sPct = s.percentage;
          const sColor = sPct >= 75 ? 'var(--color-success)' : sPct >= 60 ? 'var(--color-warning)' : 'var(--color-danger)';
          // "Can miss X more" calculation
          const minRequired = Math.ceil(s.total * 0.75);
          const canMiss = Math.max(0, (s.total - minRequired) - (s.total - s.present));

          return (
            <div
              key={s.paperId}
              className="p-4"
              style={{ background: 'var(--color-surface)', borderTop: idx > 0 ? '1px solid var(--color-separator)' : undefined }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <p className="text-callout font-medium" style={{ color: 'var(--color-text-primary)' }}>{s.paperName}</p>
                  <p className="text-footnote" style={{ color: 'var(--color-text-tertiary)' }}>{s.present}/{s.total} sessions</p>
                </div>
                <div className="flex items-center gap-2">
                  {statusIcon(sPct)}
                  <span className="text-callout tabular-nums font-semibold" style={{ color: sColor }}>{sPct}%</span>
                </div>
              </div>
              <AttendanceBar percentage={sPct} />
              {sPct < 75 && s.total > 0 && (
                <p className="text-footnote mt-1.5" style={{ color: 'var(--color-warning-text)' }}>
                  {canMiss > 0
                    ? `You can miss ${canMiss} more class${canMiss !== 1 ? 'es' : ''} in ${s.paperCode} and stay above 75%.`
                    : `You need to attend all remaining ${s.paperCode} sessions to recover.`}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
