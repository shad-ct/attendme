import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GraduationCap, Users, BookOpen, Layers, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface AuditLog {
  _id: string;
  timestamp: string;
  actor: { name: string; role: string; };
  action: string;
  entityType: string;
}

interface Event {
  _id: string;
  title: string;
  type: string;
  status: string;
  eventDate?: string;
  dueDate?: string;
}

const AdminDashboard: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: studentsRes, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['admin-users-student-count'],
    queryFn: async () => (await api.get('/admin/users?role=STUDENT&limit=1')).data
  });

  const { data: teachersRes, isLoading: isLoadingTeachers } = useQuery({
    queryKey: ['admin-users-teacher-count'],
    queryFn: async () => (await api.get('/admin/users?role=TEACHER&limit=1')).data
  });

  const { data: coursesRes, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['admin-courses-count'],
    queryFn: async () => (await api.get('/admin/courses')).data
  });

  const { data: semestersRes, isLoading: isLoadingSemesters } = useQuery({
    queryKey: ['admin-semesters-count'],
    queryFn: async () => (await api.get('/admin/semesters')).data
  });

  const { data: auditLogsRes, isLoading: isLoadingAuditLogs } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => (await api.get('/admin/audit-logs?limit=5')).data
  });

  const { data: eventsRes, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => (await api.get('/events/admin?limit=5')).data
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => await api.delete(`/events/admin/${id}`),
    onSuccess: () => {
      toast.success('Event deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
    },
    onError: () => toast.error('Failed to delete event')
  });

  const studentCount = studentsRes?.meta?.total ?? 0;
  const teacherCount = teachersRes?.meta?.total ?? 0;
  const courseCount = coursesRes?.data?.length ?? 0;
  const semesterCount = semestersRes?.data?.length ?? 0;

  const stats = [
    { label: 'Total Students', value: isLoadingStudents ? '-' : studentCount, icon: GraduationCap },
    { label: 'Total Teachers', value: isLoadingTeachers ? '-' : teacherCount, icon: Users },
    { label: 'Total Courses', value: isLoadingCourses ? '-' : courseCount, icon: BookOpen },
    { label: 'Active Semesters', value: isLoadingSemesters ? '-' : semesterCount, icon: Layers },
  ];

  return (
    <div className="flex flex-col gap-8 p-6" style={{ backgroundColor: 'var(--color-background)', minHeight: '100vh', color: 'var(--color-text-primary)' }}>
      <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="flex flex-col gap-2 p-5 rounded-xl border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-separator)' }}>
            <div className="flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
              <stat.icon size={18} strokeWidth={2} />
              <span className="text-sm font-medium">{stat.label}</span>
            </div>
            <span className="text-3xl font-medium tracking-tight mt-1">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-medium tracking-tight">Recent Activity</h2>
          <div className="rounded-xl border overflow-hidden h-full" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-separator)' }}>
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-separator)' }}>
                  <th className="px-6 py-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Timestamp</th>
                  <th className="px-6 py-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Actor</th>
                  <th className="px-6 py-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Action</th>
                  <th className="px-6 py-4 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Entity</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingAuditLogs ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--color-separator)' }}>
                      <td className="px-6 py-4"><div className="h-4 w-24 rounded animate-pulse" style={{ backgroundColor: 'var(--color-separator)' }} /></td>
                      <td className="px-6 py-4"><div className="h-4 w-32 rounded animate-pulse" style={{ backgroundColor: 'var(--color-separator)' }} /></td>
                      <td className="px-6 py-4"><div className="h-4 w-20 rounded animate-pulse" style={{ backgroundColor: 'var(--color-separator)' }} /></td>
                      <td className="px-6 py-4"><div className="h-4 w-24 rounded animate-pulse" style={{ backgroundColor: 'var(--color-separator)' }} /></td>
                    </tr>
                  ))
                ) : !auditLogsRes?.data || auditLogsRes.data.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center" style={{ color: 'var(--color-text-tertiary)' }}>No recent activity found.</td>
                  </tr>
                ) : (
                  auditLogsRes.data.map((log: AuditLog) => (
                    <tr key={log._id} style={{ borderBottom: '1px solid var(--color-separator)' }} className="last:border-0">
                      <td className="px-6 py-4 whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium">{log.actor?.name || 'Unknown'}</span>
                          <span className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{log.actor?.role}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">{log.action}</td>
                      <td className="px-6 py-4" style={{ color: 'var(--color-text-secondary)' }}>{log.entityType}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-medium tracking-tight flex items-center justify-between">
            <span>Recent Events</span>
          </h2>
          <div className="rounded-xl border overflow-hidden flex flex-col h-full" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-separator)' }}>
            {isLoadingEvents ? (
              <div className="flex-1 p-6 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !eventsRes?.data || eventsRes.data.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12" style={{ color: 'var(--color-text-tertiary)' }}>
                <CalendarIcon size={32} className="opacity-20 mb-3" />
                <p>No recent events</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--color-separator)' }}>
                {eventsRes.data.map((event: Event) => (
                  <div key={event._id} className="p-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                          {event.type}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-500/10 text-gray-500">
                          {event.status}
                        </span>
                      </div>
                      <h3 className="font-medium">{event.title}</h3>
                      {(event.eventDate || event.dueDate) && (
                        <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                          {event.eventDate ? `Event: ${format(new Date(event.eventDate), 'PP')}` : `Due: ${format(new Date(event.dueDate!), 'PP')}`}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteEventMutation.mutate(event._id)}
                      disabled={deleteEventMutation.isPending}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      title="Delete Event"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
