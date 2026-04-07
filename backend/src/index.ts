import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './models/db';
import routes from './routes';
import { initSocket } from './socket';

// ... baqi saari imports same raheingi

dotenv.config();

const app = express();
const server = http.createServer(app);

// ... middleware aur socket initialization same rahega

const PORT = process.env.PORT || 5000;

// FIX: Is condition ke baghair tests crash honge
if (process.env.NODE_ENV !== 'test') {
  const start = async () => {
    try {
      await initDB();
      server.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
      });
    } catch (err) {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
  };
  start();
}

// Export 'app' for supertest and 'server' for potential socket tests
export default app;
export { server };