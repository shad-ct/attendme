import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Calendar, Clock, Users, User, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';

interface Session {
  _id: string;
  semesterId: { _id: string; name: string };
  subjectId: { _id: string; name: string };
  teacherId: { _id: string; name: string };
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  stats?: {
    total: number;
    present: number;
  };
}

interface Student {
  _id: string;
  name: string;
  email: string;
  rollNumber?: string;
}

interface AttendanceRecord {
  _id: string;
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  remarks?: string;
}

interface RosterData {
  session: Session;
  roster: {
    student: Student;
    record: AttendanceRecord | null;
  }[];
}

export default function AdminAttendance() {
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const isToday = date === format(new Date(), 'yyyy-MM-dd');

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['admin', 'attendance', 'sessions', date],
    queryFn: async () => {
      // The requirement states using the teacher route for today's sessions
      // which works for admin too.
      if (!isToday) return [];
      const res = await api.get<{ data: Session[] }>('/attendance/sessions/today');
      return res.data.data;
    },
  });

  return (
    <div className="flex flex-col gap-6" style={{ color: 'var(--color-text-primary)' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Live Attendance</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Monitor and manage today's class sessions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 rounded-md text-sm outline-none border focus:ring-1"
            style={{
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              borderColor: 'var(--color-separator)'
            }}
          />
        </div>
      </div>

      {!isToday ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-lg border border-dashed" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-separator)' }}>
          <Calendar className="w-10 h-10 mb-4 opacity-50" style={{ color: 'var(--color-text-secondary)' }} />
          <h3 className="text-lg font-medium">Historical View Not Supported Here</h3>
          <p className="text-sm mt-1 max-w-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
            Please select today's date to view live class sessions. Historical attendance viewing will be available in reports.
          </p>
          <button 
            onClick={() => setDate(format(new Date(), 'yyyy-MM-dd'))}
            className="mt-6 px-4 py-2 rounded-md text-sm font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}
          >
            Jump to Today
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-lg border border-dashed" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-separator)' }}>
          <AlertCircle className="w-10 h-10 mb-4 opacity-50" style={{ color: 'var(--color-text-secondary)' }} />
          <h3 className="text-lg font-medium">No Sessions Today</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            There are no classes scheduled for today.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-separator)', backgroundColor: 'var(--color-surface)' }}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-sm font-medium uppercase tracking-wider" style={{ borderColor: 'var(--color-separator)', color: 'var(--color-text-secondary)' }}>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Semester & Subject</th>
                <th className="px-4 py-3">Teacher</th>
                <th className="px-4 py-3">Attendance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-separator)' }}>
              {sessions.map((session) => {
                const total = session.stats?.total || 0;
                const present = session.stats?.present || 0;
                const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
                
                return (
                  <tr key={session._id} className="text-sm transition-colors hover:opacity-80">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 opacity-70" />
                        <span>{session.startTime} - {session.endTime}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{session.semesterId?.name}</div>
                      <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{session.subjectId?.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'var(--color-background)' }}>
                          <User className="w-3 h-3 opacity-50" />
                        </div>
                        {session.teacherId?.name}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {total > 0 ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>{present} / {total}</span>
                            <span className="font-medium">{percentage}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-background)' }}>
                            <div 
                              className="h-full rounded-full transition-all"
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: percentage < 50 ? '#ef4444' : percentage < 80 ? '#f59e0b' : '#10b981'
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs italic opacity-50">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        session.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedSessionId(session._id)}
                        className="px-3 py-1.5 rounded text-xs font-medium transition-opacity hover:opacity-80"
                        style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-separator)' }}
                      >
                        View Roster
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedSessionId && (
        <RosterModal
          sessionId={selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
        />
      )}
    </div>
  );
}

interface RosterFormValues {
  records: {
    studentId: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
    name: string;
  }[];
}

function RosterModal({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'attendance', 'roster', sessionId],
    queryFn: async () => {
      const res = await api.get<{ data: RosterData }>(`/attendance/sessions/${sessionId}/attendance`);
      return res.data.data;
    },
  });

  const { control, handleSubmit, reset } = useForm<RosterFormValues>({
    defaultValues: { records: [] }
  });

  const { fields } = useFieldArray({
    control,
    name: 'records'
  });

  React.useEffect(() => {
    if (data?.roster) {
      reset({
        records: data.roster.map(r => ({
          studentId: r.student._id,
          name: r.student.name,
          status: r.record?.status || 'ABSENT'
        }))
      });
    }
  }, [data, reset]);

  const updateMutation = useMutation({
    mutationFn: async (values: RosterFormValues) => {
      const payload = {
        records: values.records.map(r => ({
          studentId: r.studentId,
          status: r.status
        }))
      };
      await api.put(`/attendance/sessions/${sessionId}/attendance`, payload);
    },
    onSuccess: () => {
      toast.success('Attendance updated');
      queryClient.invalidateQueries({ queryKey: ['admin', 'attendance'] });
      onClose();
    },
    onError: () => {
      toast.error('Failed to update attendance');
    }
  });

  if (!data && isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="rounded-xl shadow-xl w-full max-w-2xl p-8 flex justify-center" style={{ backgroundColor: 'var(--color-surface)' }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-separator)' }}>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Class Roster
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {data?.session?.semesterId?.name} • {data?.session?.subjectId?.name}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <XCircle className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="flex-1 overflow-auto flex flex-col">
          <div className="p-6 flex-1 overflow-y-auto">
            {fields.length === 0 ? (
              <div className="text-center py-8 opacity-50" style={{ color: 'var(--color-text-secondary)' }}>
                No students enrolled in this semester.
              </div>
            ) : (
              <div className="grid gap-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: 'var(--color-separator)', backgroundColor: 'var(--color-background)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-surface)' }}>
                        <User className="w-4 h-4 opacity-50" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{field.name}</div>
                      </div>
                    </div>
                    <Controller
                      control={control}
                      name={`records.${index}.status`}
                      render={({ field: { value, onChange } }) => (
                        <div className="flex items-center gap-1 rounded-md p-1" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-separator)' }}>
                          {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const).map(status => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => onChange(status)}
                              className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${value === status ? 'shadow-sm' : 'opacity-60 hover:opacity-100'}`}
                              style={{
                                backgroundColor: value === status 
                                  ? (status === 'PRESENT' ? '#10b981' : status === 'ABSENT' ? '#ef4444' : status === 'LATE' ? '#f59e0b' : 'var(--color-separator)')
                                  : 'transparent',
                                color: value === status ? '#fff' : 'inherit'
                              }}
                            >
                              {status === 'PRESENT' ? 'P' : status === 'ABSENT' ? 'A' : status === 'LATE' ? 'L' : 'E'}
                            </button>
                          ))}
                        </div>
                      )}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="px-6 py-4 border-t flex items-center justify-end gap-3" style={{ borderColor: 'var(--color-separator)', backgroundColor: 'var(--color-background)' }}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-md"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending || fields.length === 0}
              className="px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-accent)', color: '#fff' }}
            >
              {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Attendance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
