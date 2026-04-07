import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task } from '../../store/slices/taskSlice';
import TaskCard from './TaskCard';
import AddTaskModal from './AddTaskModal';

interface Member { id: string; name: string; email: string; role: string; }
interface Props {
  id: 'todo' | 'in_progress' | 'done';
  title: string; tasks: Task[]; projectId: string; members: Member[];
  onTaskCreated: (task: Task) => void; onTaskDeleted: (id: string) => void;
  onTaskMoved?: (task: Task) => void; color: string; dotColor: string;
  ownerId: string;
}

const KanbanColumn: React.FC<Props> = ({ id, title, tasks, projectId, members, onTaskCreated, onTaskDeleted, onTaskMoved, color, dotColor, ownerId }) => {
  const [addOpen, setAddOpen] = useState(false);
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <>
      <div ref={setNodeRef}
        className={`flex flex-col rounded-2xl p-4 min-h-[500px] transition-all duration-200 ${isOver ? 'bg-gray-800/80 ring-2 ring-violet-500/30' : 'bg-gray-900/50'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
            <h3 className={`font-semibold text-sm uppercase tracking-wider ${color}`}>{title}</h3>
            <span className="text-xs text-gray-600 bg-gray-800 rounded-full px-2 py-0.5 font-medium">{tasks.length}</span>
          </div>
          <button onClick={() => setAddOpen(true)}
            className="w-6 h-6 rounded-md bg-gray-800 hover:bg-violet-600/30 text-gray-500 hover:text-violet-400 transition flex items-center justify-center text-lg leading-none">+</button>
        </div>
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3 flex-1">
            {tasks.length === 0 && (
              <div onClick={() => setAddOpen(true)}
                className="flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed border-gray-800 text-gray-700 hover:border-gray-700 hover:text-gray-600 cursor-pointer transition">
                <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4"/>
                </svg>
                <span className="text-xs">Add task</span>
              </div>
            )}
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} ownerId={ownerId} members={members} onDelete={onTaskDeleted} onTaskMoved={onTaskMoved} />
            ))}
          </div>
        </SortableContext>
        {tasks.length > 0 && (
          <button onClick={() => setAddOpen(true)}
            className="mt-3 w-full py-2 rounded-lg text-gray-600 hover:text-gray-400 hover:bg-gray-800/50 text-xs flex items-center justify-center gap-1 transition">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            Add task
          </button>
        )}
      </div>
      {addOpen && <AddTaskModal projectId={projectId} defaultStatus={id} members={members} onClose={() => setAddOpen(false)} onCreated={onTaskCreated} />}
    </>
  );
};

export default KanbanColumn;
