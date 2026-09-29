import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, X, Trash2, Edit2 } from 'lucide-react';
import api from '@/lib/api';

interface Paper {
  _id: string;
  code: string;
  name: string;
  credits: number;
  semesterId?: { _id: string; name: string };
  teacherId?: { _id: string; name: string; email: string };
}

const AdminPapers: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: papersRes } = useQuery({
    queryKey: ['admin-papers'],
    queryFn: async () => (await api.get('/admin/papers')).data
  });

  const { data: semestersRes } = useQuery({
    queryKey: ['admin-semesters'],
    queryFn: async () => (await api.get('/admin/semesters')).data,
    enabled: isModalOpen
  });

  const { data: teachersRes } = useQuery({
    queryKey: ['admin-teachers'],
    queryFn: async () => (await api.get('/admin/users?role=TEACHER')).data,
    enabled: isModalOpen
  });

  const form = useForm();

  const createPaper = useMutation({
    mutationFn: async (data: any) => {
      if (data._id) return (await api.patch(`/admin/papers/${data._id}`, data)).data;
      return (await api.post('/admin/papers', data)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-papers'] });
      toast.success('Paper saved');
      setIsModalOpen(false);
      form.reset();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to save paper')
  });

  const deletePaper = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/admin/papers/${id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-papers'] });
      toast.success('Paper deleted');
    },
    onError: () => toast.error('Failed to delete paper')
  });

  const papers = papersRes?.data || [];
  const semesters = semestersRes?.data || [];
  const teachers = teachersRes?.data || [];

  const filteredPapers = papers.filter((p: Paper) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text-primary)' }}>
      <div className="px-6 pt-6 pb-4 border-b flex flex-col gap-6" style={{ borderColor: 'var(--color-separator)' }}>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Papers</h1>
          <button 
            onClick={() => { form.reset({}); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            style={{ backgroundColor: 'var(--color-text-primary)', color: 'var(--color-background)' }}
          >
            <Plus size={16} />
            Create Paper
          </button>
        </div>
      </div>

      <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--color-separator)', backgroundColor: 'var(--color-surface)' }}>
        <input
          type="text"
          placeholder="Search papers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-sm px-4 py-2 rounded-lg border text-sm outline-none bg-transparent"
          style={{ borderColor: 'var(--color-separator)' }}
        />
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="sticky top-0 z-10" style={{ backgroundColor: 'var(--color-surface)' }}>
            <tr style={{ borderBottom: '1px solid var(--color-separator)' }}>
              <th className="px-6 py-3 font-medium opacity-70">Code</th>
              <th className="px-6 py-3 font-medium opacity-70">Name</th>
              <th className="px-6 py-3 font-medium opacity-70">Credits</th>
              <th className="px-6 py-3 font-medium opacity-70">Semester</th>
              <th className="px-6 py-3 font-medium opacity-70">Teacher</th>
              <th className="px-6 py-3 font-medium opacity-70 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPapers.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center opacity-50">No papers found.</td></tr>
            ) : (
              filteredPapers.map((p: Paper) => (
                <tr key={p._id} style={{ borderBottom: '1px solid var(--color-separator)' }}>
                  <td className="px-6 py-4 font-mono text-xs">{p.code}</td>
                  <td className="px-6 py-4 font-medium">{p.name}</td>
                  <td className="px-6 py-4 opacity-70">{p.credits}</td>
                  <td className="px-6 py-4 opacity-70">{p.semesterId?.name || 'N/A'}</td>
                  <td className="px-6 py-4 opacity-70">{p.teacherId ? `${p.teacherId.name} (${p.teacherId.email})` : 'Unassigned'}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { form.reset({ ...p, semesterId: p.semesterId?._id, teacherId: p.teacherId?._id }); setIsModalOpen(true); }} className="p-1 opacity-40 hover:opacity-100 hover:text-blue-500 transition-colors mr-2"><Edit2 size={16} /></button>
                    <button onClick={() => { if (confirm('Delete paper?')) deletePaper.mutate(p._id); }} className="p-1 opacity-40 hover:opacity-100 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl p-6 shadow-xl relative" style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-separator)' }}>
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 opacity-50 hover:opacity-100"><X size={20} /></button>
            <h2 className="text-xl font-semibold mb-6">{form.getValues('_id') ? 'Edit Paper' : 'Create Paper'}</h2>

            <form onSubmit={form.handleSubmit((data) => createPaper.mutate(data))} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Paper Code</label>
                <input {...form.register('code', { required: true })} className="px-3 py-2 rounded-lg border outline-none bg-transparent" style={{ borderColor: 'var(--color-separator)' }} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Paper Name</label>
                <input {...form.register('name', { required: true })} className="px-3 py-2 rounded-lg border outline-none bg-transparent" style={{ borderColor: 'var(--color-separator)' }} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Credits</label>
                <input type="number" {...form.register('credits', { required: true, valueAsNumber: true })} className="px-3 py-2 rounded-lg border outline-none bg-transparent" style={{ borderColor: 'var(--color-separator)' }} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Semester</label>
                <select {...form.register('semesterId', { required: true })} className="px-3 py-2 rounded-lg border outline-none bg-transparent" style={{ borderColor: 'var(--color-separator)' }}>
                  <option value="" disabled>Select semester...</option>
                  {semesters.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Teacher</label>
                <select {...form.register('teacherId', { required: true })} className="px-3 py-2 rounded-lg border outline-none bg-transparent" style={{ borderColor: 'var(--color-separator)' }}>
                  <option value="" disabled>Select teacher...</option>
                  {teachers.map((t: any) => <option key={t._id} value={t._id}>{t.name} ({t.email})</option>)}
                </select>
              </div>
              <button type="submit" disabled={createPaper.isPending} className="mt-2 py-2 rounded-lg font-medium" style={{ backgroundColor: 'var(--color-text-primary)', color: 'var(--color-background)' }}>Submit</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPapers;
