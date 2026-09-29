import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Search, ChevronLeft, ChevronRight, Plus, MoreHorizontal } from 'lucide-react';
import api from '@/lib/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  studentId?: string;
  employeeId?: string;
  className?: string;
  courseName?: string;
  teachingSubjects?: string;
}

const AdminUsers: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: usersRes, isLoading } = useQuery({
    queryKey: ['admin-users', activeTab, debouncedSearch, page],
    queryFn: async () => {
      const res = await api.get(`/admin/users?role=${activeTab}&search=${encodeURIComponent(debouncedSearch)}&page=${page}&limit=10`);
      return res.data;
    }
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await api.patch(`/admin/users/${id}/status`, { isActive });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User status updated');
    },
    onError: () => {
      toast.error('Failed to update user status');
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const createUser = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        role: activeTab,
      };
      const res = await api.post('/admin/users', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(`${activeTab === 'STUDENT' ? 'Student' : 'Teacher'} created successfully`);
      setIsModalOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create user');
    }
  });

  const onSubmit = (data: any) => {
    createUser.mutate(data);
  };

  const users = usersRes?.data || [];
  const meta = usersRes?.meta || { total: 0, page: 1, totalPages: 1 };

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text-primary)' }}>
      {/* Header & Tabs */}
      <div className="px-6 pt-6 pb-4 border-b flex flex-col gap-6" style={{ borderColor: 'var(--color-separator)' }}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <button 
            onClick={() => { reset(); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            style={{ backgroundColor: 'var(--color-text-primary)', color: 'var(--color-background)' }}
          >
            <Plus size={16} />
            Create {activeTab === 'STUDENT' ? 'Student' : 'Teacher'}
          </button>
        </div>
        
        <div className="flex gap-6">
          {(['STUDENT', 'TEACHER'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(1); setSearchTerm(''); }}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab ? '' : 'border-transparent'}`}
              style={{ 
                color: activeTab === tab ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                borderColor: activeTab === tab ? 'var(--color-text-primary)' : 'transparent'
              }}
            >
              {tab === 'STUDENT' ? 'Students' : 'Teachers'}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--color-separator)', backgroundColor: 'var(--color-surface)' }}>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--color-text-secondary)' }} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border text-sm outline-none transition-colors"
            style={{ 
              backgroundColor: 'var(--color-background)', 
              borderColor: 'var(--color-separator)',
              color: 'var(--color-text-primary)'
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="sticky top-0 z-10" style={{ backgroundColor: 'var(--color-surface)' }}>
            <tr style={{ borderBottom: '1px solid var(--color-separator)' }}>
              <th className="px-6 py-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Name</th>
              <th className="px-6 py-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Email</th>
              <th className="px-6 py-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Details</th>
              <th className="px-6 py-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Status</th>
              <th className="px-6 py-3 font-medium" style={{ color: 'var(--color-text-secondary)' }}>Joined</th>
              <th className="px-6 py-3 font-medium text-right" style={{ color: 'var(--color-text-secondary)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
               <tr>
                <td colSpan={6} className="px-6 py-12 text-center" style={{ color: 'var(--color-text-tertiary)' }}>Loading...</td>
               </tr>
            ) : users.length === 0 ? (
               <tr>
                <td colSpan={6} className="px-6 py-12 text-center" style={{ color: 'var(--color-text-tertiary)' }}>No users found.</td>
               </tr>
            ) : (
              users.map((user: User) => (
                <tr key={user._id} className="group transition-colors" style={{ borderBottom: '1px solid var(--color-separator)' }}>
                  <td className="px-6 py-4 font-medium">{user.name}</td>
                  <td className="px-6 py-4" style={{ color: 'var(--color-text-secondary)' }}>{user.email}</td>
                  <td className="px-6 py-4">
                    {activeTab === 'STUDENT' ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{user.studentId || 'No ID'}</span>
                        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                          {user.courseName ? `${user.courseName} - ${user.className}` : 'Unassigned'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{user.employeeId || 'No ID'}</span>
                        <span className="text-xs truncate max-w-[200px]" style={{ color: 'var(--color-text-tertiary)' }} title={user.teachingSubjects || ''}>
                          {user.teachingSubjects || 'Unassigned'}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => toggleStatus.mutate({ id: user._id, isActive: !user.isActive })}
                      className="text-xs font-medium px-3 py-1.5 rounded transition-colors"
                      style={{ 
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-separator)',
                        color: user.isActive ? 'var(--color-text-secondary)' : 'var(--color-text-primary)'
                      }}
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--color-separator)', backgroundColor: 'var(--color-surface)' }}>
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Showing {users.length} of {meta.total} results
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="p-2 rounded border disabled:opacity-50"
            style={{ borderColor: 'var(--color-separator)', backgroundColor: 'var(--color-background)' }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            disabled={page >= meta.totalPages}
            onClick={() => setPage(p => p + 1)}
            className="p-2 rounded border disabled:opacity-50"
            style={{ borderColor: 'var(--color-separator)', backgroundColor: 'var(--color-background)' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl p-6 shadow-xl" style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-separator)' }}>
            <h2 className="text-xl font-semibold mb-4">Create {activeTab === 'STUDENT' ? 'Student' : 'Teacher'}</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Name</label>
                <input {...register('name', { required: true })} className="w-full px-3 py-2 rounded-lg border outline-none" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-separator)', color: 'var(--color-text-primary)' }} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Email</label>
                <input type="email" {...register('email', { required: true })} className="w-full px-3 py-2 rounded-lg border outline-none" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-separator)', color: 'var(--color-text-primary)' }} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Password</label>
                <input type="password" {...register('password', { required: true })} className="w-full px-3 py-2 rounded-lg border outline-none" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-separator)', color: 'var(--color-text-primary)' }} />
              </div>
              
              {activeTab === 'STUDENT' ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Student ID</label>
                  <input {...register('studentId', { required: true })} className="w-full px-3 py-2 rounded-lg border outline-none" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-separator)', color: 'var(--color-text-primary)' }} />
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Employee ID</label>
                  <input {...register('employeeId', { required: true })} className="w-full px-3 py-2 rounded-lg border outline-none" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-separator)', color: 'var(--color-text-primary)' }} />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Phone (Optional)</label>
                <input {...register('phone')} className="w-full px-3 py-2 rounded-lg border outline-none" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-separator)', color: 'var(--color-text-primary)' }} />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg font-medium text-sm border"
                  style={{ borderColor: 'var(--color-separator)', color: 'var(--color-text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUser.isPending}
                  className="px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-50"
                  style={{ backgroundColor: 'var(--color-text-primary)', color: 'var(--color-background)' }}
                >
                  {createUser.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
