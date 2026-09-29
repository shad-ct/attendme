import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { BookOpen, Calendar, ChevronRight } from 'lucide-react';

interface Paper {
  id: string;
  name: string;
  code: string;
  type: string;
  credits: number;
}

interface Semester {
  id: string;
  name: string;
  courseName: string;
  startDate: string;
  endDate: string;
  myPapers: Paper[];
}

export default function TeacherClasses() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await api.get('/teacher/classes');
        // The endpoint is expected to return { data: Semester[] }
        setSemesters(response.data.data || []);
      } catch (err) {
        setError('Failed to load classes.');
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-8" style={{ color: 'var(--color-text-secondary)' }}>
        <div className="animate-spin w-8 h-8 border-4 rounded-full border-t-transparent" style={{ borderColor: 'var(--color-separator)', borderTopColor: 'var(--color-accent)' }}></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4" style={{ color: 'var(--color-danger-text)' }}>{error}</div>;
  }

  return (
    <div className="flex flex-col h-full animate-fade-in" style={{ backgroundColor: 'var(--color-background)' }}>
      <header className="px-4 py-6" style={{ backgroundColor: 'var(--color-surface)' }}>
        <h1 className="text-title-1 m-0">My Classes</h1>
        <p className="text-subhead mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Manage your assigned classes and subjects
        </p>
      </header>
      
      <main className="flex-1 p-4 overflow-y-auto">
        {semesters.length === 0 ? (
          <div className="text-center p-8 mt-4 rounded-xl" style={{ backgroundColor: 'var(--color-surface)' }}>
            <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>No classes assigned yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {semesters.map((semester) => (
              <div 
                key={semester.id} 
                className="rounded-xl p-4 elevated shadow-sm cursor-pointer hover:-translate-y-1 transition-transform"
                style={{ backgroundColor: 'var(--color-surface)' }}
                onClick={() => navigate(`/teacher/classes/${semester.id}`)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h2 className="text-title-3 m-0">{semester.courseName}</h2>
                    <p className="text-subhead" style={{ color: 'var(--color-text-secondary)' }}>{semester.name}</p>
                  </div>
                  <ChevronRight size={20} style={{ color: 'var(--color-text-tertiary)' }} />
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={16} style={{ color: 'var(--color-text-tertiary)' }} />
                  <span className="text-footnote" style={{ color: 'var(--color-text-secondary)' }}>
                    {new Date(semester.startDate).toLocaleDateString()} - {new Date(semester.endDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="divider mb-3"></div>

                <div>
                  <p className="text-caption font-semibold mb-2" style={{ color: 'var(--color-text-tertiary)' }}>ASSIGNED PAPERS</p>
                  <div className="flex flex-col gap-2">
                    {semester.myPapers.map((paper) => (
                      <div key={paper.id} className="flex items-center gap-3 p-2 rounded-lg" style={{ backgroundColor: 'var(--color-background)' }}>
                        <div className="p-2 rounded-md" style={{ backgroundColor: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}>
                          <BookOpen size={16} />
                        </div>
                        <div className="flex-1">
                          <p className="text-subhead font-medium m-0">{paper.name}</p>
                          <p className="text-caption m-0" style={{ color: 'var(--color-text-secondary)' }}>{paper.code} • {paper.type}</p>
                        </div>
                      </div>
                    ))}
                    {semester.myPapers.length === 0 && (
                      <p className="text-footnote" style={{ color: 'var(--color-text-secondary)' }}>No papers assigned.</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
