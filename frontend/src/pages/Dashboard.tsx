import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchProjects, createProject, deleteProject, updateProject, selectProject, socketProjectRemoved, socketProjectAdded, socketProjectUpdated } from '../store/slices/projectSlice';
import { clearTasks } from '../store/slices/taskSlice';
import { logout } from '../store/slices/authSlice';
import { useProjectSocket } from '../hooks/useSocket';
import KanbanBoard from '../components/Board/KanbanBoard';
import toast from 'react-hot-toast';
import api from '../api/axios';

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { projects, selectedProject, loading } = useSelector((s: RootState) => s.projects);
  const { user, token } = useSelector((s: RootState) => s.auth);
  const [newProjectName, setNewProjectName] = useState('');
  const [addingProject, setAddingProject] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => { dispatch(fetchProjects()); }, [dispatch]);

  // Hook returns the socket ref to emit events
  const socketRef = useProjectSocket(token, {
    onProjectGranted: async (projectId) => {
      try {
        const res = await api.get('/projects');
        const newProject = res.data.find((p: any) => p.id === projectId);
        if (newProject) {
          dispatch(socketProjectAdded(newProject));
          toast(`🎉 You were added to "${newProject.name}"!`, { style: { background: '#1e293b', color: '#fff' }, duration: 4000 });
        }
      } catch {}
    },
    onProjectRevoked: (projectId) => {
      dispatch(socketProjectRemoved(projectId));
      toast.error('You were removed from a project');
    },
    // Real-time update for members when owner renames
    onProjectUpdated: (updatedProject) => {
      dispatch(socketProjectUpdated(updatedProject));
    }
  });

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const project = await dispatch(createProject({ name: newProjectName.trim(), description: '' })).unwrap();
      dispatch(selectProject(project));
      setNewProjectName(''); setAddingProject(false);
      toast.success('Project created!');
    } catch (err: any) { toast.error(err || 'Failed to create project'); }
  };

  const handleSelectProject = (project: any) => {
    if (selectedProject?.id === project.id) return;
    dispatch(clearTasks());
    dispatch(selectProject(project));
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await dispatch(deleteProject(id)).unwrap();
      socketRef.current?.emit('project_deleted', { projectId: id });
      toast.success('Project deleted');
      setConfirmDelete(null);
    } catch { toast.error('Failed to delete project'); }
  };

  const handleUpdateProject = async (id: string) => {
    if (!editName.trim()) { setEditingProjectId(null); return; }
    try {
      const updatedProject = await dispatch(updateProject({ id, name: editName.trim(), description: '' })).unwrap();
      // Socket emit so others see the change
      socketRef.current?.emit('project_updated', { projectId: id, project: updatedProject });
      toast.success("Project updated");
      setEditingProjectId(null);
    } catch (err: any) { toast.error(err || "Update failed"); }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed md:relative z-30 md:z-auto h-full md:h-auto w-64 bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden'}`}>
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">L</span>
            </div>
            <span className="text-white font-bold">Limi AI</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-500 hover:text-white">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-gray-500 text-xs uppercase tracking-wider font-medium">Projects</span>
            <button onClick={() => setAddingProject(true)} title="New project"
              className="w-5 h-5 rounded bg-gray-800 hover:bg-violet-600/30 text-gray-500 hover:text-violet-400 transition flex items-center justify-center text-sm">+</button>
          </div>

          {addingProject && (
            <div className="mb-2 bg-gray-800 rounded-lg p-2.5 border border-violet-600/30">
              <input autoFocus type="text" placeholder="Project name..." value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreateProject(); if (e.key === 'Escape') { setAddingProject(false); setNewProjectName(''); } }}
                className="w-full bg-transparent text-white text-sm outline-none placeholder-gray-500" />
              <div className="flex gap-1.5 mt-2">
                <button onClick={handleCreateProject} disabled={!newProjectName.trim()}
                  className="text-xs bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white px-2.5 py-1 rounded-md transition">Add</button>
                <button onClick={() => { setAddingProject(false); setNewProjectName(''); }}
                  className="text-xs text-gray-400 hover:text-white px-2.5 py-1 rounded-md transition">Cancel</button>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-6">
              <svg className="animate-spin w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            </div>
          )}

          <div className="space-y-0.5">
            {projects.map(project => (
              <div key={project.id} className="group relative">
                {editingProjectId === project.id ? (
                  <div className="mb-1 bg-gray-800 rounded-lg p-2 border border-violet-500/50 shadow-lg">
                    <input autoFocus className="w-full bg-transparent text-white text-sm outline-none border-b border-violet-500/30 pb-1 mb-2"
                      value={editName} onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleUpdateProject(project.id); if (e.key === "Escape") setEditingProjectId(null); }} />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => handleUpdateProject(project.id)} className="text-[10px] bg-violet-600 hover:bg-violet-500 px-2 py-0.5 rounded text-white transition">Save</button>
                      <button onClick={() => setEditingProjectId(null)} className="text-[10px] text-gray-400 hover:text-white">Cancel</button>
                    </div>
                  </div>
                ) : confirmDelete === project.id ? (
                  <div className="px-3 py-2 bg-red-950/50 border border-red-800/50 rounded-lg">
                    <p className="text-red-300 text-xs mb-2">Delete project?</p>
                    <div className="flex gap-1.5">
                      <button onClick={() => handleDeleteProject(project.id)} className="text-xs bg-red-700 hover:bg-red-600 text-white px-2 py-0.5 rounded transition">Delete</button>
                      <button onClick={() => setConfirmDelete(null)} className="text-xs text-gray-400 hover:text-white px-2 py-0.5 rounded transition">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div onClick={() => handleSelectProject(project)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition ${selectedProject?.id === project.id ? 'bg-violet-600/20 text-violet-300 border border-violet-600/20' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedProject?.id === project.id ? 'bg-violet-400' : 'bg-gray-700'}`} />
                    <span className="text-sm flex-1 truncate">{project.name}</span>
                    
                    {project.owner_id === user?.id && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Edit Icon */}
                        <button onClick={(e) => { e.stopPropagation(); setEditingProjectId(project.id); setEditName(project.name); }}
                          className="p-1 text-gray-500 hover:text-violet-400 rounded hover:bg-gray-700 transition">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                        </button>
                        {/* Delete Icon */}
                        <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(project.id); }}
                          className="p-1 text-gray-500 hover:text-red-400 rounded hover:bg-gray-700 transition">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-700 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">{user?.name?.[0]?.toUpperCase()}</div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-gray-500 text-xs truncate">{user?.email}</p>
            </div>
            <button onClick={() => { dispatch(logout()); toast('Logged out', { icon: '👋' }); }} className="text-gray-600 hover:text-red-400 transition p-1 rounded">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur border-b border-gray-800 px-4 sm:px-6 py-3 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          {selectedProject && (
            <div className="flex items-center gap-2 text-sm">
              <span className="hidden sm:inline text-gray-500">Projects</span>
              <span className="hidden sm:inline text-gray-700">/</span>
              <span className="text-white font-medium">{selectedProject.name}</span>
            </div>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-gray-500 text-xs hidden sm:inline">Live sync</span>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 overflow-auto">
          {selectedProject ? (
            <KanbanBoard projectId={selectedProject.id} projectName={selectedProject.name} ownerId={(selectedProject as any).owner_id} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
              <div className="w-20 h-20 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center mb-5">
                <svg className="w-10 h-10 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">{projects.length === 0 ? 'Welcome to Limi AI!' : 'Select a project'}</h3>
              <p className="text-gray-500 text-sm mb-6 max-w-xs">{projects.length === 0 ? 'Create your first project to start collaborating.' : 'Choose a project from the sidebar to open its board.'}</p>
              {projects.length === 0 && (
                <button onClick={() => { setSidebarOpen(true); setTimeout(() => setAddingProject(true), 100); }} className="bg-violet-600 hover:bg-violet-500 text-white text-sm px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                  Create First Project
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;