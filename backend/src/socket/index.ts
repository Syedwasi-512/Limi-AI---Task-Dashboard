import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

export const initSocket = (io: Server) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      (socket as any).user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = (socket as any).user;

    socket.on('join_project', (projectId: string) => {
      socket.join(`project:${projectId}`);
    });

    socket.on('leave_project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });

    // Task events
    socket.on('task_moved', (data: { projectId: string; task: any }) => {
      socket.to(`project:${data.projectId}`).emit('task_updated', { task: data.task, movedBy: user.name });
    });

    socket.on('task_created', (data: { projectId: string; task: any }) => {
      socket.to(`project:${data.projectId}`).emit('task_added', { task: data.task, createdBy: user.name });
    });

    socket.on('task_deleted', (data: { projectId: string; taskId: string }) => {
      socket.to(`project:${data.projectId}`).emit('task_removed', { taskId: data.taskId, deletedBy: user.name });
    });

    // Member events
    socket.on('member_added', (data: { projectId: string; member: any }) => {
      socket.to(`project:${data.projectId}`).emit('member_joined', { member: data.member });
      // Notify the added user specifically (they join via their user room)
      io.to(`user:${data.member.id}`).emit('project_access_granted', { projectId: data.projectId });
    });

    socket.on('member_removed', (data: { projectId: string; userId: string }) => {
      socket.to(`project:${data.projectId}`).emit('member_left', { userId: data.userId });
      // Notify the removed user
      io.to(`user:${data.userId}`).emit('project_access_revoked', { projectId: data.projectId });
    });

    // Project events
    socket.on('project_updated', (data: { projectId: string; project: any }) => {
      socket.to(`project:${data.projectId}`).emit('project_changed', { project: data.project });
    });

    socket.on('project_deleted', (data: { projectId: string }) => {
      io.to(`project:${data.projectId}`).emit('project_removed', { projectId: data.projectId });
    });

    // Each user joins their personal room for direct notifications
    socket.on('join_user_room', () => {
      socket.join(`user:${user.id}`);
    });

    socket.on('disconnect', () => {});
  });
};
