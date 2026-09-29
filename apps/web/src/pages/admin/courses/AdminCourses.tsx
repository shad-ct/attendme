import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, ChevronRight, X, Trash2, Edit2 } from 'lucide-react';
import api from '@/lib/api';

interface Course { _id: string; name: string; code: string; }
interface Semester { _id: string; name: string; academicYear: string; sequence: number; }
interface EnrolledStudent {
  _id: string;
  studentId: { _id: string; name: string; email: string };
  semesterId: string;
  isCurrent: boolean;
}

const AdminCourses: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);

  const [modalType, setModalType] = useState<'COURSE' | 'SEMESTER' | 'ENROLL' | null>(null);

  // Queries
  const { data: coursesRes } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => (await api.get('/admin/courses')).data
  });

  const { data: semestersRes } = useQuery({
    queryKey: ['admin-semesters', selectedCourseId],
    queryFn: async () => (await api.get(`/admin/semesters?courseId=${selectedCourseId}`)).data,
    enabled: !!selectedCourseId
  });

  const { data: enrolledStudentsRes } = useQuery({
    queryKey: ['admin-enrolled-students', selectedSemesterId],
    queryFn: async () => (await api.get(`/admin/semesters/${selectedSemesterId}/students`)).data,
    enabled: !!selectedSemesterId
  });

  const { data: allStudentsRes } = useQuery({
    queryKey: ['admin-all-students'],
    queryFn: async () => (await api.get('/admin/users?role=STUDENT&limit=1000')).data,
    enabled: modalType === 'ENROLL'
  });

  // Forms
  const courseForm = useForm();
  const semesterForm = useForm();
  const enrollForm = useForm();

  // Mutations
  const createCourse = useMutation({
    mutationFn: async (data: any) => {
      if (data._id) return (await api.patch(`/admin/courses/${data._id}`, data)).data;
      return (await api.post('/admin/courses', data)).data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-courses'] }); toast.success('Course saved'); setModalType(null); courseForm.reset(); },
    onError: () => toast.error('Failed to save course')
  });

  const deleteCourse = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/admin/courses/${id}`)).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-courses'] }); toast.success('Course deleted'); },
    onError: () => toast.error('Failed to delete course')
  });

  const createSemester = useMutation({
    mutationFn: async (data: any) => {
      const payload = { ...data, courseId: selectedCourseId, sequence: Number(data.sequence) };
      if (data._id) return (await api.patch(`/admin/semesters/${data._id}`, payload)).data;
      return (await api.post('/admin/semesters', payload)).data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-semesters'] }); toast.success('Semester saved'); setModalType(null); semesterForm.reset(); },
    onError: () => toast.error('Failed to save semester')
  });

  const deleteSemester = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/admin/semesters/${id}`)).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-semesters'] }); toast.success('Semester deleted'); },
    onError: () => toast.error('Failed to delete semester')
  });

  const enrollStudent = useMutation({
    mutationFn: async (data: any) => (await api.post(`/admin/semesters/${selectedSemesterId}/students`, { studentId: data.studentId })).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-enrolled-students'] }); toast.success('Student enrolled'); setModalType(null); enrollForm.reset(); },
    onError: () => toast.error('Failed to enroll student')
  });

  const removeStudent = useMutation({
    mutationFn: async (studentId: string) => (await api.delete(`/admin/semesters/${selectedSemesterId}/students/${studentId}`)).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-enrolled-students'] }); toast.success('Student removed'); },
    onError: () => toast.error('Failed to remove student')
  });

  const courses = coursesRes?.data || [];
  const semesters = semestersRes?.data || [];
  const enrolledStudents = enrolledStudentsRes?.data || [];
  const allStudents = allStudentsRes?.data || [];

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text-primary)' }}>
      <div className="p-6 border-b" style={{ borderColor: 'var(--color-separator)' }}>
        <h1 className="text-2xl font-semibold tracking-tight">Curriculum Structure</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Column 1: Courses */}
        <div className="w-1/2 flex flex-col border-r" style={{ borderColor: 'var(--color-separator)' }}>
          <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-separator)', backgroundColor: 'var(--color-surface)' }}>
            <h2 className="font-semibold">Courses</h2>
            <button onClick={() => setModalType('COURSE')} className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
              <Plus size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {courses.map((course: Course) => (
              <div
                key={course._id}
                onClick={() => { setSelectedCourseId(course._id); setSelectedSemesterId(null); }}
                className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors"
                style={{ 
                  backgroundColor: selectedCourseId === course._id ? 'var(--color-accent)' : 'transparent',
                  color: selectedCourseId === course._id ? 'var(--color-background)' : 'inherit'
                }}
              >
                <div>
                  <div className="font-medium text-sm">{course.name}</div>
                  <div className="text-xs opacity-70">{course.code}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); courseForm.reset(course); setModalType('COURSE'); }} className="p-1 opacity-40 hover:opacity-100 hover:text-blue-500 transition-colors"><Edit2 size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete course?')) deleteCourse.mutate(course._id); }} className="p-1 opacity-40 hover:opacity-100 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  <ChevronRight size={16} className={selectedCourseId === course._id ? 'opacity-100' : 'opacity-40'} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Semesters */}
        <div className="w-1/2 flex flex-col border-r" style={{ borderColor: 'var(--color-separator)' }}>
          <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-separator)', backgroundColor: 'var(--color-surface)' }}>
            <h2 className="font-semibold text-sm">Semesters</h2>
            <button disabled={!selectedCourseId} onClick={() => setModalType('SEMESTER')} className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-30">
              <Plus size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {!selectedCourseId && <div className="p-4 text-sm text-center opacity-50">Select a course</div>}
            {selectedCourseId && semesters.map((sem: Semester) => (
              <div
                key={sem._id}
                onClick={() => setSelectedSemesterId(sem._id)}
                className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors"
                style={{ 
                  backgroundColor: selectedSemesterId === sem._id ? 'var(--color-accent)' : 'transparent',
                  color: selectedSemesterId === sem._id ? 'var(--color-background)' : 'inherit'
                }}
              >
                <div>
                  <div className="font-medium text-sm">{sem.name}</div>
                  <div className="text-xs opacity-70">AY {sem.academicYear} | Seq {sem.sequence}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); semesterForm.reset(sem); setModalType('SEMESTER'); }} className="p-1 opacity-40 hover:opacity-100 hover:text-blue-500 transition-colors"><Edit2 size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete semester?')) deleteSemester.mutate(sem._id); }} className="p-1 opacity-40 hover:opacity-100 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  <ChevronRight size={16} className={selectedSemesterId === sem._id ? 'opacity-100' : 'opacity-40'} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Semester Details Bottom Panel */}
      {selectedSemesterId && (
        <div className="h-64 border-t flex flex-col" style={{ borderColor: 'var(--color-separator)', backgroundColor: 'var(--color-surface)' }}>
          <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--color-separator)' }}>
            <h3 className="font-semibold">Enrolled Students</h3>
            <button onClick={() => setModalType('ENROLL')} className="px-3 py-1.5 text-xs font-medium rounded-lg" style={{ backgroundColor: 'var(--color-text-primary)', color: 'var(--color-background)' }}>
              Enroll Student
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {enrolledStudents.length === 0 ? (
              <div className="p-8 text-center text-sm opacity-50">No students enrolled in this semester.</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 backdrop-blur-md bg-transparent/80">
                  <tr style={{ borderBottom: '1px solid var(--color-separator)' }}>
                    <th className="px-4 py-2 opacity-70 font-medium">Name</th>
                    <th className="px-4 py-2 opacity-70 font-medium">Email</th>
                    <th className="px-4 py-2 opacity-70 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enrolledStudents.map((enr: EnrolledStudent) => (
                    <tr key={enr._id} style={{ borderBottom: '1px solid var(--color-separator)' }}>
                      <td className="px-4 py-2 font-medium">{enr.studentId.name}</td>
                      <td className="px-4 py-2 opacity-70">{enr.studentId.email}</td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => removeStudent.mutate(enr.studentId._id)} className="text-red-500 hover:underline text-xs">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl p-6 shadow-xl relative" style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-separator)' }}>
            <button onClick={() => setModalType(null)} className="absolute top-4 right-4 opacity-50 hover:opacity-100"><X size={20} /></button>
            <h2 className="text-xl font-semibold mb-6">
              {modalType === 'COURSE' && (courseForm.getValues('_id') ? 'Edit Course' : 'Create Course')}
              {modalType === 'SEMESTER' && (semesterForm.getValues('_id') ? 'Edit Semester' : 'Create Semester')}
              {modalType === 'ENROLL' && 'Enroll Student'}
            </h2>

            {modalType === 'COURSE' && (
              <form onSubmit={courseForm.handleSubmit((data) => createCourse.mutate(data))} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5"><label className="text-sm font-medium">Course Name</label><input {...courseForm.register('name', { required: true })} className="px-3 py-2 rounded-lg border outline-none bg-transparent" style={{ borderColor: 'var(--color-separator)' }} /></div>
                <div className="flex flex-col gap-1.5"><label className="text-sm font-medium">Course Code</label><input {...courseForm.register('code', { required: true })} className="px-3 py-2 rounded-lg border outline-none bg-transparent" style={{ borderColor: 'var(--color-separator)' }} /></div>
                <div className="flex flex-col gap-1.5"><label className="text-sm font-medium">Description</label><input {...courseForm.register('description')} className="px-3 py-2 rounded-lg border outline-none bg-transparent" style={{ borderColor: 'var(--color-separator)' }} /></div>
                <button type="submit" disabled={createCourse.isPending} className="mt-2 py-2 rounded-lg font-medium" style={{ backgroundColor: 'var(--color-text-primary)', color: 'var(--color-background)' }}>Submit</button>
              </form>
            )}

            {modalType === 'SEMESTER' && (
              <form onSubmit={semesterForm.handleSubmit((data) => createSemester.mutate(data))} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5"><label className="text-sm font-medium">Semester Name</label><input {...semesterForm.register('name', { required: true })} className="px-3 py-2 rounded-lg border outline-none bg-transparent" style={{ borderColor: 'var(--color-separator)' }} placeholder="e.g. Fall 2024" /></div>
                <div className="flex flex-col gap-1.5"><label className="text-sm font-medium">Academic Year</label><input {...semesterForm.register('academicYear', { required: true })} className="px-3 py-2 rounded-lg border outline-none bg-transparent" style={{ borderColor: 'var(--color-separator)' }} placeholder="e.g. 2024-2025" /></div>
                <div className="flex flex-col gap-1.5"><label className="text-sm font-medium">Sequence</label><input type="number" {...semesterForm.register('sequence', { required: true })} className="px-3 py-2 rounded-lg border outline-none bg-transparent" style={{ borderColor: 'var(--color-separator)' }} placeholder="e.g. 1" /></div>
                <button type="submit" disabled={createSemester.isPending} className="mt-2 py-2 rounded-lg font-medium" style={{ backgroundColor: 'var(--color-text-primary)', color: 'var(--color-background)' }}>Submit</button>
              </form>
            )}



            {modalType === 'ENROLL' && (
              <form onSubmit={enrollForm.handleSubmit((data) => enrollStudent.mutate(data))} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Select Student</label>
                  <select {...enrollForm.register('studentId', { required: true })} className="px-3 py-2 rounded-lg border outline-none bg-transparent appearance-none" style={{ borderColor: 'var(--color-separator)' }}>
                    <option value="" disabled>Select a student...</option>
                    {allStudents.map((s: any) => (
                      <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
                    ))}
                  </select>
                </div>
                <button type="submit" disabled={enrollStudent.isPending} className="mt-2 py-2 rounded-lg font-medium" style={{ backgroundColor: 'var(--color-text-primary)', color: 'var(--color-background)' }}>Enroll</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCourses;
