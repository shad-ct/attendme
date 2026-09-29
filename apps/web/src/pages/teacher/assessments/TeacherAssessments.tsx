import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { AssessmentStatus, AssessmentType } from '@attendme/shared';
import { toast } from 'react-hot-toast';
import { Plus, BookOpen, ChevronRight, FileText, Calendar, CheckCircle, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface Assessment {
  _id: string;
  title: string;
  type: string;
  status: string;
  maxMarks: number;
  paperId: { _id: string; name: string; code: string; semesterId?: any };
  semesterId: string;
  date?: string;
}

export default function TeacherAssessments() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const qc = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'ACTIVE' | 'PAST'>('UPCOMING');
  
  const showCreate = searchParams.get('create') === 'true';
  const setShowCreate = (val: boolean) => {
    if (val) setSearchParams({ create: 'true' });
    else setSearchParams({});
  };

  const [createForm, setCreateForm] = useState({ 
    title: '', 
    type: AssessmentType.CE, 
    maxMarks: 15, 
    paperId: ''
  });

  const { data: assessments = [], isLoading: loadingAssessments } = useQuery({
    queryKey: ['teacher-assessments'],
    queryFn: () => api.get('/assessments/teacher').then((r) => r.data.data as Assessment[]),
  });

  const { data: papers = [] } = useQuery({
    queryKey: ['teacher-papers'],
    queryFn: () => api.get('/papers/teacher').then((r) => r.data.data as any[]),
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const selectedPaper = papers.find(p => p._id === createForm.paperId);
      // Determine semesters for this paper. The paper might be taught to multiple classes.
      // If we don't have multiple, just use the one on paper.
      const semId = selectedPaper?.semesterId?._id || selectedPaper?.semesterId;
      const semesterIds = semId ? [semId] : [];
      
      return api.post('/assessments/teacher', { 
        ...createForm, 
        maxMarks: Number(createForm.maxMarks), 
        semesterIds 
      });
    },
    onSuccess: () => {
      toast.success('Assessment created.');
      setShowCreate(false);
      qc.invalidateQueries({ queryKey: ['teacher-assessments'] });
    },
    onError: () => toast.error('Failed to create assessment.'),
  });

  const filteredAssessments = useMemo(() => {
    return assessments.filter(a => {
      if (activeTab === 'UPCOMING') return a.status === AssessmentStatus.DRAFT;
      if (activeTab === 'ACTIVE') return a.status === AssessmentStatus.PUBLISHED;
      if (activeTab === 'PAST') return a.status === AssessmentStatus.LOCKED;
      return true;
    });
  }, [assessments, activeTab]);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-2 font-bold" style={{ color: 'var(--color-text-primary)' }}>Assessments</h1>
          <p className="text-subhead" style={{ color: 'var(--color-text-secondary)' }}>Manage assignments, CE, and exams</p>
        </div>
        <Button onClick={() => setShowCreate(true)} variant="primary" className="gap-2">
          <Plus size={16} />
          <span className="hidden sm:inline">New Assessment</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b" style={{ borderColor: 'var(--color-separator)' }}>
        {(['UPCOMING', 'ACTIVE', 'PAST'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="pb-3 text-subhead font-medium transition-colors relative"
            style={{ 
              color: activeTab === tab ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
            }}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full" style={{ background: 'var(--color-accent)' }} />
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {loadingAssessments && [1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-md" />)}
        
        {!loadingAssessments && filteredAssessments.length === 0 && (
          <div className="text-center py-12 px-4 rounded-md border border-dashed" style={{ borderColor: 'var(--color-separator)', background: 'var(--color-surface)' }}>
            <FileText size={32} className="mx-auto mb-3" style={{ color: 'var(--color-text-tertiary)' }} />
            <p className="text-headline font-semibold" style={{ color: 'var(--color-text-primary)' }}>No {activeTab.toLowerCase()} assessments.</p>
            <p className="text-subhead mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {activeTab === 'UPCOMING' ? 'Create one to get started.' : 'Assessments will appear here.'}
            </p>
          </div>
        )}

        {filteredAssessments.map(a => (
          <div 
            key={a._id}
            onClick={() => navigate(`/teacher/assessments/${a._id}/marks`)}
            className="p-4 rounded-md border flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{ 
              background: 'var(--color-surface)', 
              borderColor: 'var(--color-separator)' 
            }}
          >
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-caption font-semibold tracking-wider uppercase" style={{ color: 'var(--color-accent)' }}>
                  {a.type.replace('_', ' ')}
                </span>
                <span className="w-1 h-1 rounded-full" style={{ background: 'var(--color-text-tertiary)' }} />
                <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                  {a.maxMarks} Marks
                </span>
              </div>
              <p className="text-headline font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                {a.title}
              </p>
              <p className="text-subhead truncate mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                {a.paperId?.name} ({a.paperId?.code})
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {a.status === AssessmentStatus.DRAFT && <Badge variant="warning">Draft</Badge>}
              {a.status === AssessmentStatus.PUBLISHED && <Badge variant="success">Published</Badge>}
              {a.status === AssessmentStatus.LOCKED && <Badge variant="neutral">Locked</Badge>}
              
              <div className="p-2 rounded-full" style={{ background: 'var(--color-background)' }}>
                <ChevronRight size={16} style={{ color: 'var(--color-text-tertiary)' }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Assessment">
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-subhead block mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Paper</label>
            <select
              className="w-full px-3 py-2.5 rounded-md text-callout transition-colors outline-none focus:ring-2"
              style={{ background: 'var(--color-background)', border: '1px solid var(--color-separator)', color: 'var(--color-text-primary)' }}
              value={createForm.paperId}
              onChange={(e) => setCreateForm((p) => ({ ...p, paperId: e.target.value }))}
            >
              <option value="" disabled>Select a paper...</option>
              {papers.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.code})</option>)}
            </select>
          </div>
          
          <div>
            <Input
              label="Title"
              value={createForm.title}
              onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Midterm Exam, Assignment 1"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-subhead block mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Type</label>
              <select
                className="w-full px-3 py-2.5 rounded-md text-callout transition-colors outline-none focus:ring-2"
                style={{ background: 'var(--color-background)', border: '1px solid var(--color-separator)', color: 'var(--color-text-primary)' }}
                value={createForm.type}
                onChange={(e) => setCreateForm((p) => ({ ...p, type: e.target.value as AssessmentType }))}
              >
                {Object.values(AssessmentType).map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <Input
                label="Max Marks"
                type="number"
                min={1}
                value={createForm.maxMarks}
                onChange={(e) => setCreateForm((p) => ({ ...p, maxMarks: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="pt-4 mt-6 flex justify-end gap-3 border-t" style={{ borderColor: 'var(--color-separator)' }}>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button 
              variant="primary" 
              disabled={!createForm.title || !createForm.paperId || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Assessment'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
