import request from 'supertest';
import server from '../src/index'; // Import as server
import jwt from 'jsonwebtoken';

jest.mock('../src/models/db', () => ({
  pool: { query: jest.fn() },
  initDB: jest.fn(),
}));

import { pool } from '../src/models/db';
const mockPool = pool as jest.Mocked<typeof pool>;
const secret = process.env.JWT_SECRET || 'limi_super_secret_jwt_key_2024';

const token = jwt.sign(
  { id: 'user-123', email: 'test@test.com', name: 'Wasi' },
  secret
);

describe('Task Controller', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/projects/:projectId/tasks', () => {
    it('should return 401 without token', async () => {
      // FIX: Changed 'app' to 'server'
      const res = await request(server).get('/api/projects/proj-1/tasks');
      expect(res.status).toBe(401);
    });

    it('should return tasks for a project', async () => {
      const mockTasks = [
        { id: 'task-1', title: 'Task 1', status: 'todo', project_id: 'proj-1' },
      ];
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: mockTasks });

      const res = await request(server)
        .get('/api/projects/proj-1/tasks')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });

  describe('POST /api/projects/:projectId/tasks', () => {
    it('should create a task successfully', async () => {
      const newTask = { id: 'task-new', title: 'New Task', status: 'todo' };
      
      // FIX: Controller 3 queries karta hai, is liye 3 mocks chahiye
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '2' }] }) // 1. Count query
        .mockResolvedValueOnce({ rows: [newTask] })       // 2. Insert query
        .mockResolvedValueOnce({ rows: [newTask] });      // 3. Full fetch query (assignee join)

      const res = await request(server)
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
      
      // FIX: moveTask controller 2 queries karta hai (update + fetch)
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] })            // 1. Update query
        .mockResolvedValueOnce({ rows: [updatedTask] }); // 2. Fetch full query

      const res = await request(server)
        .patch('/api/tasks/task-1/move')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'done', position: 0 });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('done');
    });
  });
});
