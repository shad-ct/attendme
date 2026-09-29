import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { Activity, Search, Filter, ChevronLeft, ChevronRight, Info, X } from 'lucide-react';

interface Actor {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface AuditLog {
  _id: string;
  actorUserId: Actor;
  action: string;
  entityType: string;
  entityId: string;
  before: any;
  after: any;
  createdAt: string;
}

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ENTITY_TYPES = ['ALL', 'User', 'Course', 'Class', 'Semester', 'Subject', 'Attendance'];

export default function AdminAuditLog() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit-logs', page, entityType],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (entityType !== 'ALL') {
        params.append('entityType', entityType);
      }
      const res = await api.get<{ data: AuditLog[]; meta: Meta }>(`/admin/audit-logs?${params.toString()}`);
      return res.data;
    },
  });

  const logs = data?.data || [];
  const meta = data?.meta || { page: 1, limit: 20, total: 0, totalPages: 1 };

  return (
    <div className="flex flex-col gap-6 h-full" style={{ color: 'var(--color-text-primary)' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Audit Logs</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Track system changes and administrative actions.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 p-1 rounded-md" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-separator)' }}>
            <Filter className="w-4 h-4 ml-2 opacity-50" />
            <select
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-sm font-medium py-1 pr-8 outline-none border-none cursor-pointer"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {ENTITY_TYPES.map(type => (
                <option key={type} value={type} style={{ backgroundColor: 'var(--color-surface)' }}>
                  {type === 'ALL' ? 'All Entities' : type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col rounded-lg border overflow-hidden min-h-[500px]" style={{ borderColor: 'var(--color-separator)', backgroundColor: 'var(--color-surface)' }}>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10" style={{ backgroundColor: 'var(--color-surface)' }}>
              <tr className="border-b text-sm font-medium uppercase tracking-wider" style={{ borderColor: 'var(--color-separator)', color: 'var(--color-text-secondary)' }}>
                <th className="px-5 py-4">Timestamp</th>
                <th className="px-5 py-4">Actor</th>
                <th className="px-5 py-4">Action</th>
                <th className="px-5 py-4">Entity</th>
                <th className="px-5 py-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-separator)' }}>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 w-24 rounded bg-black/5 dark:bg-white/5"></div></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-black/5 dark:bg-white/5"></div>
                        <div className="h-4 w-32 rounded bg-black/5 dark:bg-white/5"></div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><div className="h-4 w-16 rounded bg-black/5 dark:bg-white/5"></div></td>
                    <td className="px-5 py-4"><div className="h-4 w-20 rounded bg-black/5 dark:bg-white/5"></div></td>
                    <td className="px-5 py-4 flex justify-end"><div className="h-6 w-16 rounded bg-black/5 dark:bg-white/5"></div></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <Activity className="w-10 h-10 mb-3 opacity-20" />
                      <p className="text-sm font-medium">No audit logs found</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                        No matching activity was found for your current filters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5">
                    <td className="px-5 py-3 whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>
                      {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss')}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium">{log.actorUserId?.name || 'System'}</span>
                        <span className="text-xs opacity-70">{log.actorUserId?.role || 'SYSTEM'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border
                        ${log.action.includes('CREATE') ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' :
                        log.action.includes('UPDATE') ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' :
                        log.action.includes('DELETE') ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' :
                        'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'}
                      `}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{log.entityType}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text-secondary)' }}>
                          {log.entityId.slice(-6)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                        title="View Details"
                      >
                        <Info className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-5 py-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--color-separator)', backgroundColor: 'var(--color-background)' }}>
          <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Showing {logs.length > 0 ? (meta.page - 1) * meta.limit + 1 : 0} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} results
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={meta.page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="p-1.5 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/5"
              style={{ borderColor: 'var(--color-separator)', backgroundColor: 'var(--color-surface)' }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium px-2">
              Page {meta.page} of {Math.max(1, meta.totalPages)}
            </span>
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/5"
              style={{ borderColor: 'var(--color-separator)', backgroundColor: 'var(--color-surface)' }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="rounded-xl shadow-xl w-full max-w-3xl flex flex-col max-h-[85vh] overflow-hidden" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-separator)' }}>
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  Audit Log Details
                  <span className="text-xs font-normal px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-background)' }}>
                    {selectedLog._id}
                  </span>
                </h2>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {selectedLog.action} on {selectedLog.entityType} ({selectedLog.entityId}) by {selectedLog.actorUserId?.name || 'System'}
                </p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5">
                <X className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6 flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--color-separator)', backgroundColor: 'var(--color-background)' }}>
                  <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-tertiary)' }}>Timestamp</div>
                  <div>{format(new Date(selectedLog.createdAt), 'PPpp')}</div>
                </div>
                <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--color-separator)', backgroundColor: 'var(--color-background)' }}>
                  <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-tertiary)' }}>Actor</div>
                  <div>{selectedLog.actorUserId?.name} ({selectedLog.actorUserId?.email})</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col h-full rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-separator)' }}>
                  <div className="px-4 py-2 border-b text-xs font-semibold uppercase tracking-wider bg-red-500/10 text-red-600 dark:text-red-400" style={{ borderColor: 'var(--color-separator)' }}>
                    Before State
                  </div>
                  <pre className="p-4 text-xs font-mono overflow-auto flex-1 m-0" style={{ backgroundColor: 'var(--color-background)' }}>
                    {selectedLog.before ? JSON.stringify(selectedLog.before, null, 2) : <span className="opacity-50 italic">None</span>}
                  </pre>
                </div>
                <div className="flex flex-col h-full rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-separator)' }}>
                  <div className="px-4 py-2 border-b text-xs font-semibold uppercase tracking-wider bg-green-500/10 text-green-600 dark:text-green-400" style={{ borderColor: 'var(--color-separator)' }}>
                    After State
                  </div>
                  <pre className="p-4 text-xs font-mono overflow-auto flex-1 m-0" style={{ backgroundColor: 'var(--color-background)' }}>
                    {selectedLog.after ? JSON.stringify(selectedLog.after, null, 2) : <span className="opacity-50 italic">None</span>}
                  </pre>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t flex justify-end" style={{ borderColor: 'var(--color-separator)', backgroundColor: 'var(--color-background)' }}>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-sm font-medium rounded-md bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
