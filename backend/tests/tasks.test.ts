import request from 'supertest';
import { app } from '../src/index';
import jwt from 'jsonwebtoken';

jest.mock('../src/models/db', () => ({
  pool: { query: jest.fn() },
  initDB: jest.fn(),
}));

import { pool } from '../src/models/db';
const mockPool = pool as jest.Mocked<typeof pool>;

const token = jwt.sign(
  { id: 'user-123', email: 'test@test.com', name: 'Wasi' },
  'limi_super_secret_jwt_key_2024'
);

describe('Task Controller', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/projects/:projectId/tasks', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/projects/proj-1/tasks');
      expect(res.status).toBe(401);
    });

    it('should return tasks for a project', async () => {
      const mockTasks = [
        { id: 'task-1', title: 'Task 1', status: 'todo', project_id: 'proj-1' },
        { id: 'task-2', title: 'Task 2', status: 'in_progress', project_id: 'proj-1' },
      ];
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: mockTasks });

      const res = await request(app)
        .get('/api/projects/proj-1/tasks')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });
  });

  describe('POST /api/projects/:projectId/tasks', () => {
    it('should return 400 if title is missing', async () => {
      const res = await request(app)
        .post('/api/projects/proj-1/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'No title here' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Task title is required');
    });

    it('should create a task successfully', async () => {
      const newTask = { id: 'task-new', title: 'New Task', status: 'todo', project_id: 'proj-1' };
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({ rows: [newTask] });

      const res = await request(app)
        .post('/api/projects/proj-1/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'New Task', status: 'todo' });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('New Task');
    });
  });

  describe('PATCH /api/tasks/:id/move', () => {
    it('should move task to new status', async () => {
      const updatedTask = { id: 'task-1', title: 'Task 1', status: 'done', position: 0 };
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [updatedTask] });

      const res = await request(app)
        .patch('/api/tasks/task-1/move')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'done', position: 0 });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('done');
    });
  });
});
