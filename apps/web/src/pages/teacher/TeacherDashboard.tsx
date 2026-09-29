import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Clock, ChevronRight, Users, Plus, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface Session {
  _id: string;
  startTime: string;
  endTime: string;
  status: string;
  semesterId: { name: string; academicYear: string };
  paperId: { name: string; code: string };
  attendanceSummary: { present: number; total: number };
}

interface Assessment {
  _id: string;
  title: string;
  type: string;
  status: string;
  paperId: { name: string; code: string };
}

function SessionCard({ session }: { session: Session }) {
  const navigate = useNavigate();
  const paper = session.paperId;
  const cls = session.semesterId;
  const isCompleted = session.status === 'COMPLETED';

  return (
    <button
      onClick={() => navigate(`/teacher/attendance/${session._id}`)}
      className="w-full text-left p-4 rounded-md flex items-center justify-between gap-3 transition-all active:scale-[0.98]"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-separator)' }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-headline font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
          {paper?.name ?? 'Unknown Paper'}
        </p>
        <p className="text-subhead mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          {cls?.name} · {session.startTime}–{session.endTime}
        </p>
        {isCompleted && (
          <div className="flex items-center gap-1 mt-1">
            <Users size={12} style={{ color: 'var(--color-text-tertiary)' }} />
            <span className="text-footnote" style={{ color: 'var(--color-text-tertiary)' }}>
              {session.attendanceSummary.present} present · {session.attendanceSummary.total - session.attendanceSummary.present} absent
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isCompleted ? (
          <span className="text-footnote px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'var(--color-success-muted)', color: 'var(--color-success-text)' }}>
            <CheckCircle size={12} /> Done
          </span>
        ) : (
          <span className="text-footnote px-2 py-0.5 rounded-full font-medium animate-pulse" style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}>Take Attendance</span>
        )}
        <ChevronRight size={16} style={{ color: 'var(--color-text-tertiary)' }} />
      </div>
    </button>
  );
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = format(new Date(), 'EEEE, d MMMM');

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['teacher-sessions-today'],
    queryFn: () => api.get('/attendance/sessions/today').then((r) => r.data.data as Session[]),
  });

  const { data: assessments, isLoading: assessmentsLoading } = useQuery({
    queryKey: ['teacher-assessments'],
    queryFn: () => api.get('/assessments/teacher').then((r) => r.data.data as Assessment[]),
  });

  const drafts = assessments?.filter(a => a.status === 'DRAFT') || [];
  const pendingAttendance = sessions?.filter(s => s.status !== 'COMPLETED') || [];

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      {/* Greeting */}
      <div>
        <p className="text-subhead" style={{ color: 'var(--color-text-secondary)' }}>{today}</p>
        <h1 className="text-title-1 font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Good morning, {user?.name?.split(' ')[0]}.
        </h1>
      </div>

      {/* Quick Actions Grid */}
      <section>
        <h2 className="text-subhead font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => navigate('/teacher/assessments?create=true')}
            className="p-4 rounded-md flex flex-col items-center justify-center gap-2 text-center transition-transform active:scale-95" 
            style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
          >
            <Plus size={24} />
            <span className="text-footnote font-medium">New Assessment</span>
          </button>
          <button 
            onClick={() => navigate('/teacher/notifications')}
            className="p-4 rounded-md flex flex-col items-center justify-center gap-2 text-center transition-transform active:scale-95" 
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-separator)' }}
          >
            <AlertCircle size={24} style={{ color: 'var(--color-text-secondary)' }} />
            <span className="text-footnote font-medium" style={{ color: 'var(--color-text-primary)' }}>Announce</span>
          </button>
        </div>
      </section>

      {/* Pending Work */}
      {(drafts.length > 0 || pendingAttendance.length > 0) && (
        <section>
          <h2 className="text-subhead font-semibold mb-3 uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--color-warning)' }}>
            <AlertCircle size={14} /> Action Required
          </h2>
          <div className="space-y-2">
            {pendingAttendance.map(s => (
              <div key={s._id} className="p-3 rounded-md flex items-center justify-between" style={{ background: 'var(--color-warning-muted)', border: '1px solid var(--color-warning)' }}>
                <div>
                  <p className="text-footnote font-medium" style={{ color: 'var(--color-text-primary)' }}>Unmarked Attendance: {s.paperId?.name}</p>
                  <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>{s.semesterId?.name} ({s.startTime})</p>
                </div>
                <button onClick={() => navigate(`/teacher/attendance/${s._id}`)} className="text-footnote font-semibold" style={{ color: 'var(--color-warning)' }}>Mark</button>
              </div>
            ))}
            {drafts.map(d => (
              <div key={d._id} className="p-3 rounded-md flex items-center justify-between" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-separator)' }}>
                <div>
                  <p className="text-footnote font-medium" style={{ color: 'var(--color-text-primary)' }}>Draft: {d.title}</p>
                  <p className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>{d.paperId?.name}</p>
                </div>
                <button onClick={() => navigate(`/teacher/assessments/${d._id}/marks`)} className="text-footnote font-semibold" style={{ color: 'var(--color-accent)' }}>Enter Marks</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Today's classes */}
      <section>
        <h2 className="text-subhead font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>Today's Classes</h2>

        {sessionsLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-md skeleton" />
            ))}
          </div>
        )}

        {sessions && sessions.length === 0 && (
          <div className="p-6 rounded-md text-center" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-separator)' }}>
            <Clock size={28} className="mx-auto mb-2" style={{ color: 'var(--color-text-tertiary)' }} />
            <p className="text-headline" style={{ color: 'var(--color-text-primary)' }}>No classes today.</p>
            <p className="text-subhead mt-1" style={{ color: 'var(--color-text-secondary)' }}>Enjoy the break.</p>
          </div>
        )}

        {sessions && sessions.length > 0 && (
          <div className="space-y-2">
            {sessions.map((s) => <SessionCard key={s._id} session={s} />)}
          </div>
        )}
      </section>
    </div>
  );
}
