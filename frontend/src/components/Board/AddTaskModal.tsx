import React, { useState } from 'react';
import { Task } from '../../store/slices/taskSlice';
import { useDispatch } from 'react-redux';
import { createTask } from '../../store/slices/taskSlice';
import { AppDispatch } from '../../store';
import toast from 'react-hot-toast';

interface Member { id: string; name: string; email: string; role: string; }
interface Props {
  projectId: string;
  defaultStatus: Task['status'];
  members: Member[];
  onClose: () => void;
  onCreated: (task: Task) => void;
}

const AddTaskModal: React.FC<Props> = ({ projectId, defaultStatus, members, onClose, onCreated }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [form, setForm] = useState({ title: '', description: '', status: defaultStatus, assignee_id: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setLoading(true);
    try {
      const payload = { ...form, assignee_id: form.assignee_id || undefined };
      const task = await dispatch(createTask({ projectId, data: payload })).unwrap();
      onCreated(task);
      toast.success('Task created!');
      onClose();
    } catch { toast.error('Failed to create task'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h3 className="text-white font-semibold text-lg">New Task</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5">Title *</label>
            <input autoFocus type="text" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              onKeyDown={e => e.key === 'Escape' && onClose()}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500 transition"
              placeholder="What needs to be done?" required />
          </div>
          <div>
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500 transition resize-none"
              placeholder="Add more details (optional)..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5">Column</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Task['status'] })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 transition">
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5">Assign To</label>
              <select value={form.assignee_id} onChange={e => setForm({ ...form, assignee_id: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 transition">
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 text-sm transition">
              Cancel
            </button>
            <button type="submit" disabled={loading || !form.title.trim()}
              className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium transition">
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;
