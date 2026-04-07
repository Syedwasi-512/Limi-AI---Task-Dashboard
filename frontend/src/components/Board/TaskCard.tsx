import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../../store/slices/taskSlice';
import { useDispatch } from 'react-redux';
import { deleteTask, socketTaskUpdated } from '../../store/slices/taskSlice';
import { AppDispatch } from '../../store';
import TaskEditModal from './TaskEditModal';
import toast from 'react-hot-toast';

interface Member { id: string; name: string; email: string; role: string; }
interface Props { task: Task; members: Member[]; onDelete: (id: string) => void; onTaskMoved?: (task: Task) => void; ownerId: string; }

const borderLeft: Record<string, string> = {
  todo: 'border-l-gray-600',
  in_progress: 'border-l-yellow-500',
  done: 'border-l-green-500',
};

const TaskCard: React.FC<Props> = ({ task, members, onDelete, onTaskMoved, ownerId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [deleting, setDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this task?')) return;
    setDeleting(true);
    try {
      await dispatch(deleteTask(task.id)).unwrap();
      onDelete(task.id);
      toast.success('Task deleted');
    } catch { toast.error('Failed to delete task'); }
    finally { setDeleting(false); }
  };

  const handleUpdated = (updated: Task) => {
    dispatch(socketTaskUpdated(updated));
    if (onTaskMoved) onTaskMoved(updated);
  };

  return (
    <>
      <div ref={setNodeRef} style={style as React.CSSProperties}
        className={`bg-gray-800 border border-gray-700 border-l-4 ${borderLeft[task.status]} rounded-xl p-3.5 group hover:border-gray-600 hover:shadow-lg hover:shadow-black/20 transition-all`}>
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <h4 className="text-white text-sm font-medium leading-snug">{task.title}</h4>
          {task.description && (
            <p className="text-gray-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">{task.description}</p>
          )}
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700/50">
          {/* Assignee avatar */}
          {task.assignee_name ? (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 bg-violet-700 rounded-full flex items-center justify-center text-white text-[9px] font-bold">
                {task.assignee_name[0].toUpperCase()}
              </div>
              <span className="text-gray-500 text-xs">{task.assignee_name}</span>
            </div>
          ) : (
            <span className="text-gray-700 text-xs">Unassigned</span>
          )}
          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); setEditOpen(true); }}
              className="text-gray-500 hover:text-violet-400 transition p-1 rounded hover:bg-gray-700" title="Edit">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
            <button onClick={handleDelete} disabled={deleting}
              className="text-gray-500 hover:text-red-400 transition p-1 rounded hover:bg-gray-700" title="Delete">
              {deleting
                ? <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              }
            </button>
          </div>
        </div>
      </div>
      {editOpen && <TaskEditModal task={task} members={members} ownerId={ownerId} onClose={() => setEditOpen(false)} onUpdated={handleUpdated} />}
    </>
  );
};

export default TaskCard;
