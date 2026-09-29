import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { ChevronLeft, GraduationCap, Clock, Activity } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  paperName: string;
}

interface AssessmentMark {
  id: string;
  assessmentName: string;
  paperName: string;
  marksObtained: number;
  totalMarks: number;
}

interface StudentDetails {
  id: string;
  name: string;
  enrollmentNo: string;
  attendanceHistory: AttendanceRecord[];
  assessmentMarks: AssessmentMark[];
}

export default function TeacherStudentView() {
  const { semesterId, studentId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const res = await api.get(`/teacher/classes/${semesterId}/student/${studentId}`);
        setData(res.data.data);
      } catch (err) {
        setError('Failed to load student details.');
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, [semesterId, studentId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-8" style={{ color: 'var(--color-text-secondary)' }}>
         <div className="animate-spin w-8 h-8 border-4 rounded-full border-t-transparent" style={{ borderColor: 'var(--color-separator)', borderTopColor: 'var(--color-accent)' }}></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-full gap-4">
        <p className="text-body" style={{ color: 'var(--color-danger-text)' }}>{error || 'Student not found.'}</p>
        <button 
          onClick={() => navigate(-1)} 
          className="text-subhead px-4 py-2 rounded-md"
          style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)' }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in" style={{ backgroundColor: 'var(--color-background)' }}>
      <header className="px-4 py-4 elevated sticky top-0 z-10" style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-separator)' }}>
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-subhead mb-2" 
          style={{ color: 'var(--color-accent)' }}
        >
          <ChevronLeft size={20} /> Back to Class
        </button>
        <div className="flex items-center gap-4 mt-2">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-title-2 font-bold" style={{ backgroundColor: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}>
            {data.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-title-2 m-0">{data.name}</h1>
            <p className="text-subhead m-0" style={{ color: 'var(--color-text-secondary)' }}>{data.enrollmentNo}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 overflow-y-auto space-y-6">
        
        {/* Attendance Section */}
        <section>
          <h2 className="text-title-3 mb-3 flex items-center gap-2">
            <Clock size={20} style={{ color: 'var(--color-accent)' }} />
            Attendance (Your Subjects)
          </h2>
          {data.attendanceHistory?.length > 0 ? (
            <div className="flex flex-col gap-2">
              {data.attendanceHistory.map(record => (
                <div key={record.id} className="p-3 rounded-lg flex justify-between items-center" style={{ backgroundColor: 'var(--color-surface)' }}>
                  <div>
                    <p className="text-body font-medium m-0">{record.paperName}</p>
                    <p className="text-footnote m-0" style={{ color: 'var(--color-text-secondary)' }}>
                      {new Date(record.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-caption px-2 py-1 rounded-full font-medium status-${record.status.toLowerCase()}`}>
                    {record.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-subhead italic" style={{ color: 'var(--color-text-secondary)' }}>No attendance records found.</p>
          )}
        </section>

        <div className="divider"></div>

        {/* Assessments Section */}
        <section>
          <h2 className="text-title-3 mb-3 flex items-center gap-2">
            <Activity size={20} style={{ color: 'var(--color-accent)' }} />
            Assessments (Your Subjects)
          </h2>
          {data.assessmentMarks?.length > 0 ? (
            <div className="flex flex-col gap-3">
              {data.assessmentMarks.map(mark => (
                <div key={mark.id} className="p-4 rounded-xl elevated" style={{ backgroundColor: 'var(--color-surface)' }}>
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-body font-medium m-0">{mark.assessmentName}</p>
                    <div className="flex flex-col items-end">
                      <span className="text-title-3 font-bold" style={{ color: 'var(--color-accent)' }}>
                        {mark.marksObtained} <span className="text-subhead font-normal" style={{ color: 'var(--color-text-tertiary)' }}>/ {mark.totalMarks}</span>
                      </span>
                      <span className="text-caption" style={{ color: 'var(--color-text-secondary)' }}>
                        {Math.round((mark.marksObtained / mark.totalMarks) * 100)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-footnote m-0 flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
                    <GraduationCap size={14} /> {mark.paperName}
                  </p>
                </div>
              ))}
            </div>
          ) : (
             <p className="text-subhead italic" style={{ color: 'var(--color-text-secondary)' }}>No assessment marks found.</p>
          )}
        </section>

      </main>
    </div>
  );
}
