import { Router } from 'express';
import { register, login, getMe, searchUsers } from '../controllers/authController';
import { getProjects, createProject, updateProject, deleteProject, getMembers, addMember, removeMember } from '../controllers/projectController';
import { getTasks, createTask, updateTask, moveTask, deleteTask } from '../controllers/taskController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Auth
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', authenticate, getMe);
router.get('/auth/search', authenticate, searchUsers);

// Projects
router.get('/projects', authenticate, getProjects);
router.post('/projects', authenticate, createProject);
router.put('/projects/:id', authenticate, updateProject);
router.delete('/projects/:id', authenticate, deleteProject);

// Members
router.get('/projects/:id/members', authenticate, getMembers);
router.post('/projects/:id/members', authenticate, addMember);
router.delete('/projects/:id/members/:userId', authenticate, removeMember);

// Tasks
router.get('/projects/:projectId/tasks', authenticate, getTasks);
router.post('/projects/:projectId/tasks', authenticate, createTask);
router.put('/tasks/:id', authenticate, updateTask);
router.patch('/tasks/:id/move', authenticate, moveTask);
router.delete('/tasks/:id', authenticate, deleteTask);

export default router;
