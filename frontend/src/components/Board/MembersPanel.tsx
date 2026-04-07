import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

interface Member { id: string; name: string; email: string; role: string; }
interface Props {
  projectId: string; isOwner: boolean; onClose: () => void;
  onMembersChange: (members: Member[]) => void;
  onMemberAdded?: (member: Member) => void;
  onMemberRemoved?: (userId: string) => void;
}

const MembersPanel: React.FC<Props> = ({ projectId, isOwner, onClose, onMembersChange, onMemberAdded, onMemberRemoved }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  useEffect(() => { fetchMembers(); }, [projectId]);

  const fetchMembers = async () => {
    setFetching(true);
    try {
      const res = await api.get(`/projects/${projectId}/members`);
      setMembers(res.data);
      onMembersChange(res.data);
    } catch { toast.error('Failed to load members'); }
    finally { setFetching(false); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await api.post(`/projects/${projectId}/members`, { email: email.trim() });
      const updated = [...members, res.data];
      setMembers(updated);
      onMembersChange(updated);
      onMemberAdded?.(res.data); // emit socket
      setEmail('');
      toast.success(`${res.data.name} added to project!`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add member');
    } finally { setLoading(false); }
  };

  const handleRemove = async (userId: string, name: string) => {
    setLoading(true);
    try {
      await api.delete(`/projects/${projectId}/members/${userId}`);
      const updated = members.filter(m => m.id !== userId);
      setMembers(updated);
      onMembersChange(updated);
      onMemberRemoved?.(userId); // emit socket
      setConfirmRemove(null);
      toast.success(`${name} removed from project`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to remove member');
    } finally { setLoading(false); }
  };

  const roleStyle: Record<string, string> = {
    owner:  'bg-violet-600/20 text-violet-300 border border-violet-600/30',
    member: 'bg-gray-700/40 text-gray-400 border border-gray-600/30',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h3 className="text-white font-semibold text-lg">Project Members</h3>
            <p className="text-gray-500 text-xs mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition p-1 rounded-lg hover:bg-gray-800">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Add member — owner only */}
          {isOwner && (
            <form onSubmit={handleAdd}>
              <label className="block text-gray-400 text-xs uppercase tracking-wider mb-1.5">Add by Email</label>
              <div className="flex gap-2">
                <input type="email" placeholder="teammate@example.com" value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500 transition" />
                <button type="submit" disabled={loading || !email.trim()}
                  className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap">
                  {loading ? (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                  ) : 'Add'}
                </button>
              </div>
              <p className="text-gray-600 text-xs mt-1.5">User must already have a Limi AI account</p>
            </form>
          )}

          {/* Divider */}
          <div className="border-t border-gray-800" />

          {/* Members list */}
          {fetching ? (
            <div className="flex justify-center py-6">
              <svg className="animate-spin w-6 h-6 text-violet-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {members.map(member => (
                <div key={member.id}>
                  {confirmRemove === member.id ? (
                    <div className="flex items-center justify-between p-3 bg-red-950/40 border border-red-800/40 rounded-xl">
                      <p className="text-red-300 text-sm">Remove <span className="font-medium">{member.name}</span>?</p>
                      <div className="flex gap-2">
                        <button onClick={() => handleRemove(member.id, member.name)} disabled={loading}
                          className="text-xs bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition disabled:opacity-50">
                          {loading ? '...' : 'Remove'}
                        </button>
                        <button onClick={() => setConfirmRemove(null)}
                          className="text-xs text-gray-400 hover:text-white px-3 py-1 rounded-lg transition">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-800/40 hover:bg-gray-800/70 rounded-xl border border-gray-700/40 transition group">
                      <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-purple-700 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {member.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{member.name}</p>
                        <p className="text-gray-500 text-xs truncate">{member.email}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full capitalize shrink-0 ${roleStyle[member.role] || roleStyle.member}`}>
                        {member.role}
                      </span>
                      {/* Remove button — owner only, not for owner row */}
                      {isOwner && member.role !== 'owner' && (
                        <button onClick={() => setConfirmRemove(member.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition ml-1 p-1 rounded-lg hover:bg-red-950/30"
                          title="Remove member">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6h12a6 6 0 00-6-6zM21 12h-6"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!isOwner && !fetching && (
            <p className="text-gray-600 text-xs text-center pt-1">Only the project owner can manage members</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MembersPanel;
