import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateProject, Project } from '../../store/slices/projectSlice';
import { AppDispatch } from '../../store';
import toast from 'react-hot-toast';

interface Props {
  project: Project;
  onClose: () => void;
  onUpdated: (project: Project) => void;
}

const EditProjectModal: React.FC<Props> = ({ project, onClose, onUpdated }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [form, setForm] = useState({ name: project.name, description: project.description || '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Project name is required'); return; }
    setLoading(true);
    try {
      const updated = await dispatch(updateProject({ id: project.id, name: form.name.trim(), description: form.description })).unwrap();
      onUpdated(updated);
      toast.success('Project updated!');
      onClose();
    } catch (err: any) {
      toast.error(err || 'Failed to update project');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h3 className="text-white font-semibold text-lg">Edit Project</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition p-1 rounded-lg hover:bg-gray-800">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5">Project Name *</label>
            <input autoFocus type="text" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              onKeyDown={e => e.key === 'Escape' && onClose()}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500 transition"
              placeholder="Project name" required />
          </div>
          <div>
            <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500 transition resize-none"
              placeholder="Optional description..." />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 text-sm transition">
              Cancel
            </button>
            <button type="submit" disabled={loading || !form.name.trim()}
              className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium transition">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProjectModal;
