import React, { useEffect, useMemo, useState } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, PointerSensor, useSensor, useSensors, closestCorners, DragOverlay } from '@dnd-kit/core';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchTasks, moveTaskLocally, moveTask, Task } from '../../store/slices/taskSlice';
import { socketProjectUpdated, socketProjectRemoved, Project } from '../../store/slices/projectSlice';
import { useSocket } from '../../hooks/useSocket';
import KanbanColumn from './KanbanColumn';
import MembersPanel from './MembersPanel';
import EditProjectModal from './EditProjectModal';
import toast from 'react-hot-toast';
import api from '../../api/axios';

interface Member { id: string; name: string; email: string; role: string; }
interface Props { projectId: string; projectName: string; ownerId: string; }

const COLS: { id: Task['status']; title: string; color: string; dotColor: string }[] = [
  { id: 'todo',        title: 'To Do',      color: 'text-gray-300',   dotColor: 'bg-gray-500' },
  { id: 'in_progress', title: 'In Progress', color: 'text-yellow-300', dotColor: 'bg-yellow-500' },
  { id: 'done',        title: 'Done',        color: 'text-green-300',  dotColor: 'bg-green-500' },
];

const KanbanBoard: React.FC<Props> = ({ projectId, projectName, ownerId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { tasks, loading } = useSelector((s: RootState) => s.tasks);
  const { token, user } = useSelector((s: RootState) => s.auth);
  const selectedProject = useSelector((s: RootState) => s.projects.selectedProject);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [showMembers, setShowMembers] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);

  const isOwner = user?.id === ownerId;

  const { emitTaskMoved, emitTaskCreated, emitTaskDeleted,
          emitMemberAdded, emitMemberRemoved,
          emitProjectUpdated, emitProjectDeleted, socketRef } = useSocket(projectId, token);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    dispatch(fetchTasks(projectId));
    fetchMembers();
  }, [projectId]);

  // Listen for real-time project events on this board's socket
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    socket.on('member_joined', ({ member }: { member: Member }) => {
      setMembers(prev => prev.find(m => m.id === member.id) ? prev : [...prev, member]);
      toast(`👋 ${member.name} joined the project`, { style: { background: '#1e293b', color: '#fff' } });
    });

    socket.on('member_left', ({ userId }: { userId: string }) => {
      setMembers(prev => {
        const leaving = prev.find(m => m.id === userId);
        if (leaving) toast(`${leaving.name} was removed from project`, { style: { background: '#1e293b', color: '#fff' } });
        return prev.filter(m => m.id !== userId);
      });
    });

    socket.on('project_changed', ({ project }: { project: Project }) => {
      dispatch(socketProjectUpdated(project));
    });

    socket.on('project_removed', ({ projectId: pid }: { projectId: string }) => {
      dispatch(socketProjectRemoved(pid));
      toast.error('This project was deleted by the owner');
    });

    return () => {
      socket.off('member_joined');
      socket.off('member_left');
      socket.off('project_changed');
      socket.off('project_removed');
    };
  }, [socketRef.current]);

  const fetchMembers = async () => {
    try { setMembers((await api.get(`/projects/${projectId}/members`)).data); }
    catch {}
  };

  const tasksByStatus = useMemo(() => ({
    todo:        tasks.filter(t => t.status === 'todo').sort((a, b) => a.position - b.position),
    in_progress: tasks.filter(t => t.status === 'in_progress').sort((a, b) => a.position - b.position),
    done:        tasks.filter(t => t.status === 'done').sort((a, b) => a.position - b.position),
  }), [tasks]);

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const taskId = active.id as string;
    const newStatus = over.id as Task['status'];
    if (!['todo', 'in_progress', 'done'].includes(newStatus)) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;
    const pos = tasksByStatus[newStatus].length;
    dispatch(moveTaskLocally({ id: taskId, status: newStatus, position: pos }));
    try {
      const updated = await dispatch(moveTask({ id: taskId, status: newStatus, position: pos })).unwrap();
      emitTaskMoved(updated);
      toast.success(`Moved to ${newStatus.replace('_', ' ')}`, { duration: 1500 });
    } catch {
      toast.error('Failed to move task');
      dispatch(fetchTasks(projectId));
    }
  };

  const handleProjectUpdated = (project: Project) => {
    emitProjectUpdated(project);
  };

  const totalDone = tasksByStatus.done.length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;

  const currentName = selectedProject?.name || projectName;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <svg className="animate-spin w-8 h-8 text-violet-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
    </div>
  );

  return (
    <div>
      {/* Board Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-white text-xl font-bold">{currentName}</h2>
              {isOwner && (
                <button onClick={() => setShowEditProject(true)}
                  className="text-gray-600 hover:text-violet-400 transition p-1 rounded-lg hover:bg-gray-800"
                  title="Edit project">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-0.5">{totalTasks} tasks · {totalDone} completed</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Members button */}
          <button onClick={() => setShowMembers(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition group">
            <div className="flex -space-x-2">
              {members.slice(0, 3).map(m => (
                <div key={m.id} title={m.name}
                  className="w-6 h-6 bg-gradient-to-br from-violet-600 to-purple-700 rounded-full border-2 border-gray-800 flex items-center justify-center text-white text-[9px] font-bold">
                  {m.name[0].toUpperCase()}
                </div>
              ))}
              {members.length > 3 && (
                <div className="w-6 h-6 bg-gray-700 rounded-full border-2 border-gray-800 flex items-center justify-center text-gray-400 text-[9px]">
                  +{members.length - 3}
                </div>
              )}
            </div>
            <span className="text-gray-400 group-hover:text-white text-xs transition">
              {members.length} member{members.length !== 1 ? 's' : ''}
            </span>
            {isOwner && (
              <svg className="w-3.5 h-3.5 text-gray-500 group-hover:text-violet-400 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
              </svg>
            )}
          </button>

          {/* Progress */}
          {totalTasks > 0 && (
            <div className="w-36">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span><span className="font-medium text-gray-400">{progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-600 to-green-500 rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Kanban */}
      <DndContext sensors={sensors} collisionDetection={closestCorners}
        onDragStart={(e) => setActiveId(e.active.id as string)}
        onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLS.map(col => (
            <KanbanColumn key={col.id} id={col.id} title={col.title} color={col.color} dotColor={col.dotColor}
              tasks={tasksByStatus[col.id]} projectId={projectId} members={members} ownerId={ownerId}
              onTaskCreated={emitTaskCreated} onTaskDeleted={emitTaskDeleted} onTaskMoved={emitTaskMoved} />
          ))}
        </div>
        <DragOverlay>
          {activeId ? (
            <div className="bg-gray-700 border border-violet-500/50 rounded-xl p-3.5 shadow-2xl opacity-90 rotate-1">
              <p className="text-white text-sm font-medium">{tasks.find(t => t.id === activeId)?.title}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Modals */}
      {showMembers && (
        <MembersPanel projectId={projectId} isOwner={isOwner}
          onClose={() => setShowMembers(false)}
          onMembersChange={setMembers}
          onMemberAdded={emitMemberAdded}
          onMemberRemoved={emitMemberRemoved} />
      )}
      {showEditProject && selectedProject && (
        <EditProjectModal project={selectedProject}
          onClose={() => setShowEditProject(false)}
          onUpdated={handleProjectUpdated} />
      )}
    </div>
  );
};

export default KanbanBoard;
