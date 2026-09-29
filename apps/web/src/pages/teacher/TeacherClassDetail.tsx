import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Users, FileText, Bell, LayoutDashboard, ChevronLeft, ChevronRight } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  enrollmentNo: string;
  attendancePercentage?: number; // Optional based on what backend returns
}

export default function TeacherClassDetail() {
  const { semesterId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'students') {
      const fetchStudents = async () => {
        setLoading(true);
        try {
          const res = await api.get(`/teacher/classes/${semesterId}/students`);
          setStudents(res.data.data || []);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchStudents();
    }
  }, [semesterId, activeTab]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'assessments', label: 'Assessments', icon: FileText },
    { id: 'announcements', label: 'Announcements', icon: Bell },
  ];

  return (
    <div className="flex flex-col h-full animate-fade-in" style={{ backgroundColor: 'var(--color-background)' }}>
      <header className="px-4 py-4 elevated sticky top-0 z-10" style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-separator)' }}>
        <button 
          onClick={() => navigate('/teacher/classes')}
          className="flex items-center gap-1 text-subhead mb-2" 
          style={{ color: 'var(--color-accent)' }}
        >
          <ChevronLeft size={20} /> Back
        </button>
        <h1 className="text-title-2 m-0">Class Details</h1>
      </header>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar px-4 pt-3 pb-0" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="flex gap-4 border-b w-full" style={{ borderColor: 'var(--color-separator)' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 pb-3 px-1 relative transition-colors"
              style={{ 
                color: activeTab === tab.id ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                fontWeight: activeTab === tab.id ? 600 : 400
              }}
            >
              <tab.icon size={18} />
              <span className="text-subhead whitespace-nowrap">{tab.label}</span>
              {activeTab === tab.id && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full" 
                  style={{ backgroundColor: 'var(--color-accent)' }} 
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'students' && (
          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin w-8 h-8 border-4 rounded-full border-t-transparent" style={{ borderColor: 'var(--color-separator)', borderTopColor: 'var(--color-accent)' }}></div>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center p-8 mt-4 rounded-xl" style={{ backgroundColor: 'var(--color-surface)' }}>
                <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>No students found for this class.</p>
              </div>
            ) : (
              students.map((student) => (
                <div 
                  key={student.id}
                  onClick={() => navigate(`/teacher/classes/${semesterId}/student/${student.id}`)}
                  className="flex items-center justify-between p-4 rounded-xl elevated shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: 'var(--color-surface)' }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-subhead font-bold" style={{ backgroundColor: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}>
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-body font-medium m-0">{student.name}</p>
                      <p className="text-footnote m-0" style={{ color: 'var(--color-text-secondary)' }}>{student.enrollmentNo}</p>
                    </div>
                  </div>
                  <ChevronRight size={20} style={{ color: 'var(--color-text-tertiary)' }} />
                </div>
              ))
            )}
          </div>
        )}

        {activeTab !== 'students' && (
           <div className="text-center p-8 mt-4 rounded-xl" style={{ backgroundColor: 'var(--color-surface)' }}>
             <p className="text-body" style={{ color: 'var(--color-text-secondary)' }}>{tabs.find(t => t.id === activeTab)?.label} content coming soon.</p>
           </div>
        )}
      </main>
    </div>
  );
}
