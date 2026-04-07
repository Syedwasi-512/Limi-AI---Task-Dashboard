import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../api/axios';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  project_id: string;
  assignee_id: string | null;
  assignee_name: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

const initialState: TaskState = { tasks: [], loading: false, error: null };

export const fetchTasks = createAsyncThunk('tasks/fetchAll', async (projectId: string, { rejectWithValue }) => {
  try {
    const res = await api.get(`/projects/${projectId}/tasks`);
    return res.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error || 'Failed to fetch tasks');
  }
});

export const createTask = createAsyncThunk('tasks/create', async ({ projectId, data }: { projectId: string; data: Partial<Task> }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/projects/${projectId}/tasks`, data);
    return res.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error || 'Failed to create task');
  }
});

export const moveTask = createAsyncThunk('tasks/move', async ({ id, status, position }: { id: string; status: string; position: number }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/tasks/${id}/move`, { status, position });
    return res.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error || 'Failed to move task');
  }
});

export const deleteTask = createAsyncThunk('tasks/delete', async (id: string, { rejectWithValue }) => {
  try {
    await api.delete(`/tasks/${id}`);
    return id;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.error || 'Failed to delete task');
  }
});

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    // Optimistic update for drag-and-drop
    moveTaskLocally(state, action: PayloadAction<{ id: string; status: Task['status']; position: number }>) {
      const task = state.tasks.find(t => t.id === action.payload.id);
      if (task) {
        task.status = action.payload.status;
        task.position = action.payload.position;
      }
    },
    // Socket.io: another user moved a task
    socketTaskUpdated(state, action: PayloadAction<Task>) {
      const idx = state.tasks.findIndex(t => t.id === action.payload.id);
      if (idx !== -1) state.tasks[idx] = action.payload;
    },
    socketTaskAdded(state, action: PayloadAction<Task>) {
      if (!state.tasks.find(t => t.id === action.payload.id)) {
        state.tasks.push(action.payload);
      }
    },
    socketTaskRemoved(state, action: PayloadAction<string>) {
      state.tasks = state.tasks.filter(t => t.id !== action.payload);
    },
    clearTasks(state) { state.tasks = []; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => { state.loading = true; })
      .addCase(fetchTasks.fulfilled, (state, action) => { state.loading = false; state.tasks = action.payload; })
      .addCase(fetchTasks.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(createTask.fulfilled, (state, action) => { state.tasks.push(action.payload); })
      .addCase(deleteTask.fulfilled, (state, action) => { state.tasks = state.tasks.filter(t => t.id !== action.payload); })
      .addCase(moveTask.fulfilled, (state, action) => {
        const idx = state.tasks.findIndex(t => t.id === action.payload.id);
        if (idx !== -1) state.tasks[idx] = action.payload;
      });
  },
});

export const { moveTaskLocally, socketTaskUpdated, socketTaskAdded, socketTaskRemoved, clearTasks } = taskSlice.actions;
export default taskSlice.reducer;
