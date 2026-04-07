import React, { useState, useEffect } from 'react';
import { Task } from '../../store/slices/taskSlice';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface Member { id: string; name: string; email: string; role: string; }
interface Props { 
  task: Task; 
  members: Member[]; 
  onClose: () => void; 
  onUpdated: (task: Task) => void; 
  ownerId: string; 
}

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do', dot: 'bg-gray-500' },
  { value: 'in_progress', label: 'In Progress', dot: 'bg-yellow-500' },
  { value: 'done', label: 'Done', dot: 'bg-green-500' },
];

const TaskEditModal: React.FC<Props> = ({ task, members, onClose, onUpdated, ownerId }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Debugging ke liye (Aap browser console mein check kar sakte hain)
  // console.log("Current User ID:", user?.id, "Project Owner ID:", ownerId);

  // Robust check: String conversion taake type mismatch na ho
  const isOwner = String(user?.id) === String(ownerId);

  const [form, setForm] = useState({
    title: task.title,
    description: task.description || '',
    status: task.status,
    assignee_id: task.assignee_id || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setLoading(true);
    try {
      const res = await api.put(`/tasks/${task.id}`, { 
        ...form, 
        assignee_id: form.assignee_id || null 
      });
      onUpdated(res.data);
      toast.success('Task updated!');
      onClose();
    } catch { 
      toast.error('Failed to update task'); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h3 className="text-white font-semibold text-lg">
            {isOwner ? 'Edit Task' : 'Update Status'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5">Title *</label>
            <input 
              type="text" 
              value={form.title} 
              onChange={e => setForm({ ...form, title: e.target.value })}
              disabled={!isOwner}
              className={`w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 transition ${!isOwner ? 'opacity-50 cursor-not-allowed' : 'focus:ring-1 focus:ring-violet-500'}`}
              required 
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5">Description</label>
            <textarea 
              value={form.description} 
              onChange={e => setForm({ ...form, description: e.target.value })}
              disabled={!isOwner}
              rows={3}
              className={`w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 transition resize-none ${!isOwner ? 'opacity-50 cursor-not-allowed' : 'focus:ring-1 focus:ring-violet-500'}`} 
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5">Status</label>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setForm({ ...form, status: opt.value as Task['status'] })}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition ${
                    form.status === opt.value
                      ? 'border-violet-500 bg-violet-600/20 text-violet-300'
                      : 'border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5">Assigned To</label>
            <select 
              value={form.assignee_id} 
              onChange={e => setForm({ ...form, assignee_id: e.target.value })}
              disabled={!isOwner}
              className={`w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 transition ${!isOwner ? 'opacity-50 cursor-not-allowed' : 'focus:ring-1 focus:ring-violet-500'}`}
            >
              <option value="">Unassigned</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)}
            </select>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white text-sm transition">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium transition">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskEditModal;