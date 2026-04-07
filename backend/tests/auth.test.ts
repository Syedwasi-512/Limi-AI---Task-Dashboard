import request from 'supertest';
import { app } from '../src/index';

// Mock the database
jest.mock('../src/models/db', () => ({
  pool: {
    query: jest.fn(),
  },
  initDB: jest.fn(),
}));

import { pool } from '../src/models/db';
const mockPool = pool as jest.Mocked<typeof pool>;

describe('Auth Controller', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('POST /api/auth/register', () => {
    it('should return 400 if fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@test.com' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('All fields are required');
    });

    it('should return 409 if email already exists', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ id: '123' }] });
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'existing@test.com', password: 'pass123' });
      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Email already registered');
    });

    it('should register successfully with valid data', async () => {
      (mockPool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // no existing user
        .mockResolvedValueOnce({ rows: [{ id: 'uuid-123', name: 'Wasi', email: 'wasi@test.com' }] });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Wasi', email: 'wasi@test.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('wasi@test.com');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 if fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com' });
      expect(res.status).toBe(400);
    });

    it('should return 401 for invalid credentials', async () => {
      (mockPool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrong@test.com', password: 'wrongpass' });
      expect(res.status).toBe(401);
    });
  });
});
