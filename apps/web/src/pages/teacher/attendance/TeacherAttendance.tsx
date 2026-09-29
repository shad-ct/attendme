import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { AttendanceStatus } from '@attendme/shared';
import { toast } from 'react-hot-toast';
import { ChevronLeft, CheckCircle2, XCircle, Clock, MinusCircle, Save } from 'lucide-react';
import { clsx } from 'clsx';

interface StudentRow {
  student: { _id: string; name: string; email: string };
  record: { status: AttendanceStatus } | null;
}

type StatusMap = Record<string, AttendanceStatus>;

const STATUS_META = {
  [AttendanceStatus.PRESENT]:  { label: 'Present',  icon: CheckCircle2, short: 'P' },
  [AttendanceStatus.ABSENT]:   { label: 'Absent',   icon: XCircle,      short: 'A' },
  [AttendanceStatus.LATE]:     { label: 'Late',     icon: Clock,        short: 'L' },
  [AttendanceStatus.EXCUSED]:  { label: 'Excused',  icon: MinusCircle,  short: 'E' },
};

function getStatusStyle(status: AttendanceStatus | null) {
  if (!status) return { border: '2px solid var(--color-separator)', color: 'var(--color-text-tertiary)', background: 'transparent' };
  if (status === AttendanceStatus.PRESENT) return { border: '2px solid var(--color-success)', color: 'var(--color-success-text)', background: 'var(--color-success-muted)' };
  if (status === AttendanceStatus.ABSENT)  return { border: '2px solid var(--color-danger)',  color: 'var(--color-danger-text)',  background: 'var(--color-danger-muted)' };
  if (status === AttendanceStatus.LATE)    return { border: '2px solid var(--color-warning)', color: 'var(--color-warning-text)', background: 'var(--color-warning-muted)' };
  return { border: '2px solid var(--color-separator)', color: 'var(--color-neutral)', background: 'var(--color-neutral-muted)' };
}

export default function TeacherAttendance() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [statusMap, setStatusMap] = useState<StatusMap>({});
  const [dirty, setDirty] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['session-attendance', sessionId],
    queryFn: () => api.get(`/attendance/sessions/${sessionId}/attendance`).then((r) => r.data.data as { session: any; roster: StudentRow[] }),
  });

  useEffect(() => {
    if (data) {
      const initial: StatusMap = {};
      data.roster.forEach((r: StudentRow) => {
        if (r.record) initial[r.student._id] = r.record.status;
      });
      setStatusMap(initial);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (records: { studentId: string; status: AttendanceStatus }[]) =>
      api.put(`/attendance/sessions/${sessionId}/attendance`, { records }),
    onSuccess: () => {
      toast.success('Attendance saved.');
      setDirty(false);
      qc.invalidateQueries({ queryKey: ['teacher-sessions-today'] });
    },
    onError: () => toast.error('Failed to save. Please try again.'),
  });

  function markAll(status: AttendanceStatus) {
    if (!data) return;
    const all: StatusMap = {};
    data.roster.forEach((r) => { all[r.student._id] = status; });
    setStatusMap(all);
    setDirty(true);
  }

  function toggleStudent(studentId: string, status: AttendanceStatus) {
    setStatusMap((prev) => ({ ...prev, [studentId]: status }));
    setDirty(true);
  }

  function save() {
    const records = Object.entries(statusMap).map(([studentId, status]) => ({ studentId, status }));
    if (records.length === 0) { toast.error('Mark at least one student.'); return; }
    mutation.mutate(records);
  }

  const roster = data?.roster ?? [];
  const presentCount = Object.values(statusMap).filter((s) => s === AttendanceStatus.PRESENT || s === AttendanceStatus.LATE).length;
  const absentCount = Object.values(statusMap).filter((s) => s === AttendanceStatus.ABSENT).length;
  const totalMarked = Object.keys(statusMap).length;

  if (isLoading) {
    return (
      <div className="space-y-2 animate-fade-in">
        <div className="skeleton h-8 w-32 rounded" />
        {[...Array(8)].map((_, i) => <div key={i} className="skeleton h-14 rounded-md" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in pb-32">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-md" style={{ color: 'var(--color-accent)' }}>
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-title-3">{data?.session?.paperId?.name ?? 'Attendance'}</h1>
          <p className="text-subhead" style={{ color: 'var(--color-text-secondary)' }}>
            {data?.session?.semesterId?.name ?? ''} · {data?.session?.startTime}–{data?.session?.endTime}
          </p>
        </div>
      </div>

      {/* Mark all row */}
      <div className="p-3 rounded-md flex gap-2 flex-wrap" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-separator)' }}>
        <span className="text-subhead self-center" style={{ color: 'var(--color-text-secondary)' }}>Mark all:</span>
        {Object.entries(STATUS_META).map(([s, meta]) => (
          <button
            key={s}
            onClick={() => markAll(s as AttendanceStatus)}
            className="px-3 py-1.5 rounded-md text-footnote font-medium transition-all active:scale-95"
            style={getStatusStyle(s as AttendanceStatus)}
          >
            {meta.label}
          </button>
        ))}
      </div>

      {/* Live count — pinned */}
      <div className="sticky top-0 z-20 py-2 flex gap-4 text-footnote tabular-nums" style={{ background: 'var(--color-background)' }}>
        <span style={{ color: 'var(--color-success-text)' }}>✓ {presentCount} present</span>
        <span style={{ color: 'var(--color-danger-text)' }}>✗ {absentCount} absent</span>
        <span style={{ color: 'var(--color-text-tertiary)' }}>{roster.length - totalMarked} unmarked</span>
      </div>

      {/* Roster */}
      <div className="rounded-md overflow-hidden" style={{ border: '1px solid var(--color-separator)' }}>
        {roster.length === 0 && (
          <p className="p-4 text-subhead text-center" style={{ color: 'var(--color-text-secondary)' }}>No students enrolled in this class.</p>
        )}
        {roster.map((row, idx) => {
          const currentStatus = statusMap[row.student._id] ?? null;
          return (
            <div
              key={row.student._id}
              className={clsx('p-4 flex items-center justify-between gap-3', idx > 0 && 'border-t')}
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-separator)' }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-callout font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {row.student.name}
                </p>
                <p className="text-footnote truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                  {row.student.email}
                </p>
              </div>
              {/* Status buttons */}
              <div className="flex gap-1.5 flex-shrink-0">
                {Object.entries(STATUS_META).map(([s, meta]) => (
                  <button
                    key={s}
                    onClick={() => toggleStudent(row.student._id, s as AttendanceStatus)}
                    className="w-9 h-9 flex items-center justify-center rounded-md text-caption-2 font-bold transition-all active:scale-90"
                    style={currentStatus === s ? getStatusStyle(s as AttendanceStatus) : { border: '1.5px solid var(--color-separator)', color: 'var(--color-text-tertiary)', background: 'transparent' }}
                    aria-label={`${row.student.name}, ${meta.label}`}
                    title={meta.label}
                  >
                    {meta.short}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky save bar */}
      <div
        className="fixed bottom-20 lg:bottom-4 left-0 right-0 mx-4 lg:mx-auto lg:max-w-lg p-3 rounded-lg flex items-center justify-between gap-3 transition-all"
        style={{
          background: 'var(--color-elevated)',
          border: '1px solid var(--color-separator)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          opacity: dirty || totalMarked > 0 ? 1 : 0,
          pointerEvents: dirty || totalMarked > 0 ? 'all' : 'none',
        }}
      >
        <p className="text-subhead" style={{ color: 'var(--color-text-secondary)' }}>
          {dirty ? 'Unsaved changes' : 'Attendance recorded'}
        </p>
        <button
          onClick={save}
          disabled={mutation.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-callout font-semibold transition-all active:scale-95"
          style={{ background: 'var(--color-accent)', color: '#fff' }}
        >
          <Save size={16} />
          {mutation.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}
