import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Calendar, Trash2, Loader2, GripVertical } from 'lucide-react';
import { DndContext, DragOverlay, useDraggable, useDroppable, DragEndEvent } from '@dnd-kit/core';

interface Semester { _id: string; name: string; academicYear: string; }
interface Paper { _id: string; code: string; name: string; teacherId?: { _id: string; name: string; }; }
interface TimetableEntry {
  _id: string;
  semesterId: string;
  paperId: { _id: string; code: string; name: string };
  teacherId: { _id: string; name: string };
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
  startTime: string;
  endTime: string;
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const;
// Timeslots matching V FYIMP schedule; 12:30 is the lunch break slot (shown but not droppable)
const TIMESLOTS = ['09:30', '10:30', '11:30', '12:30', '13:30', '14:30', '15:30'] as const;
const BREAK_SLOT = '12:30';

// Given a HH:mm start time, returns the end time 60 minutes later
function addOneHour(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const totalMins = h * 60 + m + 60;
  return `${String(Math.floor(totalMins / 60)).padStart(2, '0')}:${String(totalMins % 60).padStart(2, '0')}`;
}

const DraggablePaper = ({ paper }: { paper: Paper }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `paper-${paper._id}`,
    data: { paper }
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`p-3 rounded-lg border shadow-sm cursor-grab flex items-start gap-3 transition-colors ${
        isDragging ? 'opacity-50' : 'bg-white dark:bg-gray-800 hover:border-[var(--color-accent)]'
      }`}
      style={{ borderColor: 'var(--color-separator)' }}
    >
      <GripVertical className="w-4 h-4 mt-0.5 opacity-50 shrink-0" />
      <div>
        <div className="text-sm font-semibold">{paper.code}</div>
        <div className="text-xs opacity-70 mt-0.5">{paper.name}</div>
        <div className="text-[10px] opacity-50 mt-1">{paper.teacherId?.name || 'Unassigned'}</div>
      </div>
    </div>
  );
};

const DroppableCell = ({ id, day, time, entry, onDelete }: { id: string, day: string, time: string, entry?: TimetableEntry, onDelete: (id: string) => void }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { day, time }
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 border-r last:border-r-0 relative group transition-colors min-h-[100px] ${
        isOver ? 'bg-[var(--color-accent)]/10' : ''
      }`}
      style={{ borderColor: 'var(--color-separator)' }}
    >
      {entry && (
        <div className="absolute inset-1 m-1 p-2 rounded-md shadow-sm border overflow-hidden flex flex-col justify-between group/card bg-white dark:bg-gray-800"
          style={{ borderColor: 'var(--color-separator)', borderLeft: '3px solid var(--color-accent)' }}
        >
          <div>
            <div className="text-xs font-bold truncate">{entry.paperId?.code}</div>
            <div className="text-[10px] opacity-70 truncate mt-0.5 leading-tight">{entry.paperId?.name}</div>
          </div>
          <div className="text-[11px] font-medium opacity-90 truncate mt-2">
            {entry.teacherId?.name}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(entry._id); }}
            className="absolute top-1 right-1 p-1.5 rounded-sm bg-red-500 text-white opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-red-600 z-10"
            title="Delete Session"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default function AdminTimetable() {
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');
  const [activePaper, setActivePaper] = useState<Paper | null>(null);
  const queryClient = useQueryClient();

  const { data: semesters = [], isLoading: isLoadingSemesters } = useQuery({
    queryKey: ['admin', 'semesters'],
    queryFn: async () => (await api.get<{ data: Semester[] }>('/admin/semesters')).data.data
  });

  React.useEffect(() => {
    if (semesters.length > 0 && !selectedSemesterId) setSelectedSemesterId(semesters[0]._id);
  }, [semesters, selectedSemesterId]);

  const { data: entries = [], isLoading: isLoadingEntries } = useQuery({
    queryKey: ['admin', 'timetable', selectedSemesterId],
    queryFn: async () => {
      if (!selectedSemesterId) return [];
      return (await api.get<{ data: TimetableEntry[] }>(`/admin/timetable/semesters/${selectedSemesterId}`)).data.data;
    },
    enabled: !!selectedSemesterId
  });

  const { data: papers = [] } = useQuery({
    queryKey: ['admin', 'papers', selectedSemesterId],
    queryFn: async () => {
      if (!selectedSemesterId) return [];
      return (await api.get<{ data: Paper[] }>(`/admin/papers?semesterId=${selectedSemesterId}`)).data.data;
    },
    enabled: !!selectedSemesterId
  });

  const addMutation = useMutation({
    mutationFn: async (data: any) => await api.post('/admin/timetable/entries', data),
    onSuccess: () => {
      toast.success('Timetable entry added');
      queryClient.invalidateQueries({ queryKey: ['admin', 'timetable', selectedSemesterId] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to add entry')
  });

  const deleteMutation = useMutation({
    mutationFn: async (entryId: string) => await api.delete(`/admin/timetable/entries/${entryId}`),
    onSuccess: () => {
      toast.success('Entry removed');
      queryClient.invalidateQueries({ queryKey: ['admin', 'timetable', selectedSemesterId] });
    },
    onError: () => toast.error('Failed to remove entry')
  });

  const handleDragStart = (e: any) => {
    setActivePaper(e.active.data.current?.paper || null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActivePaper(null);
    const { active, over } = e;
    if (!over) return;

    const paper = active.data.current?.paper as Paper;
    const { day, time } = over.data.current as { day: string, time: string };

    if (!paper || !day || !time) return;

    if (time === BREAK_SLOT) return;
    const endTime = addOneHour(time);

    addMutation.mutate({
      semesterId: selectedSemesterId,
      paperId: paper._id,
      dayOfWeek: day,
      startTime: time,
      endTime
    });
  };

  return (
    <div className="flex flex-col gap-6 h-full" style={{ color: 'var(--color-text-primary)' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Weekly Timetable</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Drag and drop papers to create the schedule.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {isLoadingSemesters ? (
            <div className="w-48 h-10 rounded-md bg-black/5 dark:bg-white/5 animate-pulse" />
          ) : (
            <select
              value={selectedSemesterId}
              onChange={(e) => setSelectedSemesterId(e.target.value)}
              className="px-4 py-2 rounded-lg text-sm font-medium outline-none border focus:ring-2 cursor-pointer shadow-sm"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-separator)' }}
            >
              <option value="" disabled>Select a semester...</option>
              {semesters.map(c => (
                <option key={c._id} value={c._id} style={{ backgroundColor: 'var(--color-surface)' }}>
                  {c.name} ({c.academicYear})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {!selectedSemesterId ? (
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed rounded-xl" style={{ borderColor: 'var(--color-separator)' }}>
          <Calendar className="w-12 h-12 mb-4 opacity-20" />
          <h3 className="text-lg font-medium">No Semester Selected</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Please select a semester from the dropdown to view or edit its timetable.
          </p>
        </div>
      ) : isLoadingEntries ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
        </div>
      ) : (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex flex-1 gap-6 min-h-0">
            {/* Sidebar for Papers */}
            <div className="w-64 flex flex-col gap-3 overflow-auto pr-2 custom-scrollbar">
              <h2 className="text-sm font-semibold uppercase tracking-wider opacity-70">Available Papers</h2>
              {papers.length === 0 ? (
                <div className="text-sm opacity-50 p-4 text-center border rounded-lg border-dashed">No papers found</div>
              ) : (
                papers.map(p => <DraggablePaper key={p._id} paper={p} />)
              )}
            </div>

            {/* Timetable Grid */}
            <div className="flex-1 overflow-auto rounded-xl border bg-white dark:bg-black/20" style={{ borderColor: 'var(--color-separator)' }}>
              <div className="min-w-[800px]">
                <div className="flex border-b sticky top-0 z-10 shadow-sm" style={{ borderColor: 'var(--color-separator)', backgroundColor: 'var(--color-surface)' }}>
                  <div className="w-20 shrink-0 border-r py-3 flex items-center justify-center" style={{ borderColor: 'var(--color-separator)' }}>
                    <Calendar className="w-4 h-4 opacity-50" />
                  </div>
                  {DAYS.map(day => (
                    <div key={day} className="flex-1 py-3 text-center text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-primary)' }}>
                      {day.slice(0, 3)}
                    </div>
                  ))}
                </div>

                <div className="divide-y" style={{ borderColor: 'var(--color-separator)' }}>
                  {TIMESLOTS.map(time => {
                    const isBreak = time === BREAK_SLOT;
                    return (
                      <div key={time} className={`flex ${isBreak ? 'min-h-[48px]' : 'min-h-[100px]'}`}>
                        <div
                          className="w-20 shrink-0 border-r flex flex-col items-center justify-center text-xs font-medium opacity-60"
                          style={{ borderColor: 'var(--color-separator)' }}
                        >
                          <span>{time}</span>
                          {!isBreak && <span className="opacity-50">–{addOneHour(time)}</span>}
                        </div>

                        {isBreak ? (
                          <div
                            className="flex-1 flex items-center justify-center text-xs font-semibold uppercase tracking-widest opacity-40"
                            style={{ background: 'var(--color-separator)' }}
                          >
                            Lunch Break
                          </div>
                        ) : (
                          DAYS.map(day => {
                            const entry = entries.find(e => e.dayOfWeek === day && e.startTime === time);
                            return (
                              <DroppableCell
                                key={`${day}-${time}`}
                                id={`${day}-${time}`}
                                day={day}
                                time={time}
                                entry={entry}
                                onDelete={(id) => deleteMutation.mutate(id)}
                              />
                            );
                          })
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          <DragOverlay>
            {activePaper ? (
              <div className="p-3 rounded-lg border shadow-lg bg-white dark:bg-gray-800 opacity-90 scale-105">
                <div className="text-sm font-semibold">{activePaper.code}</div>
                <div className="text-xs opacity-70 mt-0.5">{activePaper.name}</div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
