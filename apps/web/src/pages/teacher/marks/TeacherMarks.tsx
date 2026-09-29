import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AssessmentStatus } from '@attendme/shared';
import { toast } from 'react-hot-toast';
import { Save, ArrowLeft, CheckCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';

interface Assessment {
  _id: string;
  title: string;
  type: string;
  status: AssessmentStatus;
  maxMarks: number;
  semesterId: string;
  paperId: { name: string; code: string };
  myMark?: number; // Depending on endpoint
}

interface Student {
  _id: string;
  name: string;
  rollNumber: string;
}

export default function TeacherMarks() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [marks, setMarks] = useState<Record<string, string>>({});

  // 1. Fetch assessments and find the selected one
  const { data: assessments = [], isLoading: loadingAssessments } = useQuery({
    queryKey: ['teacher-assessments'],
    queryFn: () => api.get('/assessments/teacher').then((r) => r.data.data as Assessment[]),
  });

  const selectedAssessment = assessments.find(a => a._id === assessmentId);

  // 2. Fetch class roster
  const { data: roster = [], isLoading: loadingRoster } = useQuery({
    queryKey: ['assessment-roster', selectedAssessment?._id],
    queryFn: async () => {
      if (!selectedAssessment) return [];
      const res = await api.get(`/courses/teacher/semesters/${selectedAssessment.semesterId}/students`);
      return res.data.data.map((m: any) => m.studentId) as Student[];
    },
    enabled: !!selectedAssessment,
  });

  // 3. Fetch existing marks if any. We can get them by fetching the student marks or maybe they are returned?
  // Wait, does the API return existing marks?
  // Let's check: the router in GET /api/assessments/teacher doesn't populate marks for teacher.
  // The user requirement didn't specify an endpoint for getting existing marks, maybe we just don't have it for now or it's a separate GET `/teacher/:id/marks` that doesn't exist?
  // Actually, we can fetch all students, but if marks are already entered, how do we pre-fill?
  // Let's assume we fetch marks using `GET /assessments/teacher/${assessmentId}/marks` if it exists. But it wasn't mentioned. We'll leave it as is.
  
  // Wait, the previous code just did:
  // onClick={() => { setSelectedAssessment(a); setMarks({}); }}
  // So it didn't prefill existing marks. We'll stick to that behaviour, or if they add a GET endpoint later, they can plug it in.

  const saveMarksMutation = useMutation({
    mutationFn: (payload: { studentId: string; marks: number }[]) =>
      api.put(`/assessments/teacher/${assessmentId}/marks`, { marks: payload }),
    onSuccess: () => {
      toast.success('Marks saved successfully.');
    },
    onError: () => toast.error('Failed to save marks.'),
  });

  const publishMutation = useMutation({
    mutationFn: () => api.post(`/assessments/teacher/${assessmentId}/publish`),
    onSuccess: () => {
      toast.success('Assessment published and students notified.');
      qc.invalidateQueries({ queryKey: ['teacher-assessments'] });
    },
    onError: () => toast.error('Failed to publish assessment.'),
  });

  function handleSaveDraft() {
    const payload = Object.entries(marks)
      .filter(([, v]) => v !== '')
      .map(([studentId, m]) => ({ studentId, marks: Number(m) }));
    saveMarksMutation.mutate(payload);
  }

  if (loadingAssessments || loadingRoster) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-1/3" />
        <div className="skeleton h-64 rounded-md" />
      </div>
    );
  }

  if (!selectedAssessment) {
    return (
      <div className="text-center py-12">
        <p className="text-headline" style={{ color: 'var(--color-text-secondary)' }}>Assessment not found.</p>
        <Button onClick={() => navigate('/teacher/assessments')} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const isLocked = selectedAssessment.status === AssessmentStatus.LOCKED;
  const isPublished = selectedAssessment.status === AssessmentStatus.PUBLISHED;

  return (
    <div className="space-y-6 animate-fade-in pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/teacher/assessments')}
          className="p-2 rounded-full transition-colors active:scale-95 hover:bg-black/5"
          style={{ color: 'var(--color-text-primary)' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-title-2 font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
            {selectedAssessment.title}
          </h1>
          <p className="text-subhead truncate" style={{ color: 'var(--color-text-secondary)' }}>
            {selectedAssessment.paperId?.name} ({selectedAssessment.paperId?.code}) · Max {selectedAssessment.maxMarks} marks
          </p>
        </div>
        <div>
          {isLocked && <Badge variant="neutral" className="gap-1"><Lock size={12}/> Locked</Badge>}
          {isPublished && <Badge variant="success" className="gap-1"><CheckCircle size={12}/> Published</Badge>}
        </div>
      </div>

      {/* Roster / Marks Entry */}
      <div className="bg-surface rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-separator)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ background: 'var(--color-background)', borderBottom: '1px solid var(--color-separator)' }}>
                <th className="p-4 text-footnote font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>Student Name</th>
                <th className="p-4 text-footnote font-semibold uppercase tracking-wider w-32 text-right" style={{ color: 'var(--color-text-secondary)' }}>Marks</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((student, idx) => (
                <tr 
                  key={student._id}
                  style={{ borderTop: idx > 0 ? '1px solid var(--color-separator)' : undefined }}
                  className="transition-colors hover:bg-black/5"
                >
                  <td className="p-4 text-callout font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {student.name}
                    {student.rollNumber && (
                      <span className="block text-footnote font-normal mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                        {student.rollNumber}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <input
                      type="number"
                      min={0}
                      max={selectedAssessment.maxMarks}
                      value={marks[student._id] ?? ''}
                      onChange={(e) => setMarks((prev) => ({ ...prev, [student._id]: e.target.value }))}
                      disabled={isLocked}
                      className="w-24 ml-auto text-right tabular-nums font-medium px-3 py-2 rounded-md outline-none focus:ring-2"
                      style={{ background: 'var(--color-background)', border: '1px solid var(--color-separator)', color: 'var(--color-text-primary)' }}
                      placeholder={`/ ${selectedAssessment.maxMarks}`}
                    />
                  </td>
                </tr>
              ))}
              {roster.length === 0 && (
                <tr>
                  <td colSpan={2} className="p-8 text-center text-subhead" style={{ color: 'var(--color-text-tertiary)' }}>
                    No students found in this class.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Action Bar */}
      {!isLocked && (
        <div 
          className="fixed bottom-0 left-0 right-0 p-4 border-t flex items-center justify-between gap-3 md:relative md:border-t-0 md:p-0 md:bg-transparent"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-separator)', zIndex: 10 }}
        >
          <div className="hidden md:block">
            <p className="text-footnote" style={{ color: 'var(--color-text-tertiary)' }}>
              {Object.keys(marks).filter(k => marks[k] !== '').length} / {roster.length} graded
            </p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <Button 
              variant="secondary" 
              className="flex-1 md:flex-none gap-2"
              onClick={handleSaveDraft}
              disabled={saveMarksMutation.isPending}
            >
              <Save size={16} /> Save Draft
            </Button>
            
            {!isPublished && (
              <Button 
                variant="primary" 
                className="flex-1 md:flex-none"
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending || saveMarksMutation.isPending}
              >
                Publish Marks
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
