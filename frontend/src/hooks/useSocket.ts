import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useDispatch } from 'react-redux';
import { socketTaskUpdated, socketTaskAdded, socketTaskRemoved } from '../store/slices/taskSlice';
import toast from 'react-hot-toast';

export const useSocket = (projectId: string | null, token: string | null) => {
  const dispatch = useDispatch();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token || !projectId) return;

    socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      socket.emit('join_project', projectId);
      socket.emit('join_user_room'); // for personal notifications
    });

    socket.on('task_updated', ({ task, movedBy }: any) => {
      dispatch(socketTaskUpdated(task));
      toast(`🔄 ${movedBy} moved a task`, { style: { background: '#1e293b', color: '#fff' }, duration: 2000 });
    });

    socket.on('task_added', ({ task, createdBy }: any) => {
      dispatch(socketTaskAdded(task));
      toast(`✅ ${createdBy} added a task`, { style: { background: '#1e293b', color: '#fff' }, duration: 2000 });
    });

    socket.on('task_removed', ({ taskId, deletedBy }: any) => {
      dispatch(socketTaskRemoved(taskId));
      toast(`🗑 ${deletedBy} deleted a task`, { style: { background: '#1e293b', color: '#fff' }, duration: 2000 });
    });

    socket.on('connect_error', () => {
      toast.error('Real-time connection lost');
    });

    return () => {
      socket.emit('leave_project', projectId);
      socket.disconnect();
    };
  }, [projectId, token, dispatch]);

  const emitTaskMoved = (task: any) => socketRef.current?.emit('task_moved', { projectId, task });
  const emitTaskCreated = (task: any) => socketRef.current?.emit('task_created', { projectId, task });
  const emitTaskDeleted = (taskId: string) => socketRef.current?.emit('task_deleted', { projectId, taskId });
  const emitMemberAdded = (member: any) => socketRef.current?.emit('member_added', { projectId, member });
  const emitMemberRemoved = (userId: string) => socketRef.current?.emit('member_removed', { projectId, userId });
  const emitProjectUpdated = (project: any) => socketRef.current?.emit('project_updated', { projectId, project });
  const emitProjectDeleted = () => socketRef.current?.emit('project_deleted', { projectId });

  return { emitTaskMoved, emitTaskCreated, emitTaskDeleted, emitMemberAdded, emitMemberRemoved, emitProjectUpdated, emitProjectDeleted, socketRef };
};

// Separate hook for global project-level events (used in Dashboard)
export const useProjectSocket = (token: string | null, callbacks: {
  onProjectGranted?: (projectId: string) => void;
  onProjectRevoked?: (projectId: string) => void;
  onProjectUpdated?: (project: any) => void; // Naya callback
}) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
    });

    const socket = socketRef.current;
    socket.on('connect', () => socket.emit('join_user_room'));

    socket.on('project_access_granted', ({ projectId }: any) => {
      callbacks.onProjectGranted?.(projectId);
    });

    socket.on('project_access_revoked', ({ projectId }: any) => {
      callbacks.onProjectRevoked?.(projectId);
    });

    // Jab koi project update ho toh ye chalega
    socket.on('project_updated', (updatedProject: any) => {
      callbacks.onProjectUpdated?.(updatedProject);
    });

    return () => { socket.disconnect(); };
  }, [token]);

  return socketRef; // Return the ref so we can emit
};