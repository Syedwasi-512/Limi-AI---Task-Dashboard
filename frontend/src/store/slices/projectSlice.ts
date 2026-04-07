import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../api/axios';

export interface Project {
  id: string; name: string; description: string;
  owner_id: string; owner_name: string;
  member_count: number; task_count: number; created_at: string;
}

interface ProjectState {
  projects: Project[]; selectedProject: Project | null;
  loading: boolean; error: string | null;
}

const initialState: ProjectState = { projects: [], selectedProject: null, loading: false, error: null };

export const fetchProjects = createAsyncThunk('projects/fetchAll', async (_, { rejectWithValue }) => {
  try { return (await api.get('/projects')).data; }
  catch (err: any) { return rejectWithValue(err.response?.data?.error || 'Failed to fetch'); }
});

export const createProject = createAsyncThunk('projects/create', async (data: { name: string; description: string }, { rejectWithValue }) => {
  try { return (await api.post('/projects', data)).data; }
  catch (err: any) { return rejectWithValue(err.response?.data?.error || 'Failed to create'); }
});

export const updateProject = createAsyncThunk('projects/update', async ({ id, name, description }: { id: string; name: string; description: string }, { rejectWithValue }) => {
  try { return (await api.put(`/projects/${id}`, { name, description })).data; }
  catch (err: any) { return rejectWithValue(err.response?.data?.error || 'Failed to update'); }
});

export const deleteProject = createAsyncThunk('projects/delete', async (id: string, { rejectWithValue }) => {
  try { await api.delete(`/projects/${id}`); return id; }
  catch (err: any) { return rejectWithValue(err.response?.data?.error || 'Failed to delete'); }
});

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    selectProject(state, action: PayloadAction<Project | null>) { state.selectedProject = action.payload; },
    clearError(state) { state.error = null; },
    // Real-time: project updated by owner
    socketProjectUpdated(state, action: PayloadAction<Project>) {
      const idx = state.projects.findIndex(p => p.id === action.payload.id);
      if (idx !== -1) state.projects[idx] = { ...state.projects[idx], ...action.payload };
      if (state.selectedProject?.id === action.payload.id)
        state.selectedProject = { ...state.selectedProject, ...action.payload };
    },
    // Real-time: project deleted — remove from member's UI
    socketProjectRemoved(state, action: PayloadAction<string>) {
      state.projects = state.projects.filter(p => p.id !== action.payload);
      if (state.selectedProject?.id === action.payload) state.selectedProject = null;
    },
    // Real-time: member was added to a project they didn't have before
    socketProjectAdded(state, action: PayloadAction<Project>) {
      if (!state.projects.find(p => p.id === action.payload.id))
        state.projects.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProjects.fulfilled, (state, action) => { state.loading = false; state.projects = action.payload; })
      .addCase(fetchProjects.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(createProject.fulfilled, (state, action) => { state.projects.unshift(action.payload); })
      .addCase(updateProject.fulfilled, (state, action) => {
        const idx = state.projects.findIndex(p => p.id === action.payload.id);
        if (idx !== -1) state.projects[idx] = { ...state.projects[idx], ...action.payload };
        if (state.selectedProject?.id === action.payload.id)
          state.selectedProject = { ...state.selectedProject, ...action.payload };
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.projects = state.projects.filter(p => p.id !== action.payload);
        if (state.selectedProject?.id === action.payload) state.selectedProject = null;
      });
  },
});

export const { selectProject, clearError, socketProjectUpdated, socketProjectRemoved, socketProjectAdded } = projectSlice.actions;
export default projectSlice.reducer;
