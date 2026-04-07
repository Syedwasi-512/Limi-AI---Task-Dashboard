# 🚀 Limi AI – Real-Time Collaborative Task Dashboard

A production-ready full-stack task management application with real-time collaboration, Kanban board, JWT authentication, project members management, and Socket.io live sync.

**Stack:** React 18 · TypeScript · Tailwind CSS · Node.js · Express · PostgreSQL · Socket.io · Redux Toolkit · Docker

---

## 📋 Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Database Setup — Neon.tech (Free, No Install)](#database-setup--neontech-free-no-install)
6. [Local Setup (Manual)](#local-setup-manual)
7. [Docker Setup (One Command)](#docker-setup-one-command)
8. [Running Tests](#running-tests)
9. [API Endpoints](#api-endpoints)
10. [Production Deployment](#production-deployment)
11. [Environment Variables](#environment-variables)
12. [Troubleshooting](#troubleshooting)

---

## Features

- ✅ **JWT Authentication** — Register, Login, Protected routes
- ✅ **Kanban Board** — To Do / In Progress / Done columns
- ✅ **Drag & Drop** — Move tasks between columns with @dnd-kit
- ✅ **Task Management** — Create, Edit, Delete tasks with description & assignee
- ✅ **Project Members** — Add/remove members by email, real-time UI update
- ✅ **Task Assignment** — Assign tasks to project members
- ✅ **Project Edit** — Update project name/description (owner only)
- ✅ **Real-Time Sync** — Socket.io: task moves, member joins/leaves, project updates/deletes all sync instantly across all connected clients
- ✅ **Redux State** — Full global state management
- ✅ **Toast Notifications** — All actions give user feedback
- ✅ **Progress Bar** — Per-project task completion progress
- ✅ **Mobile Responsive** — Works on all screen sizes
- ✅ **Dark Mode UI** — Full dark theme throughout
- ✅ **Jest Tests** — 10 backend tests
- ✅ **React Testing Library** — 2 frontend component tests
- ✅ **Docker** — docker-compose spins up everything with one command
- ✅ **GitHub Actions** — CI pipeline runs tests on every push

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, Redux Toolkit, @dnd-kit |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL 15 (Neon.tech free cloud or local) |
| Real-time | Socket.io |
| Auth | JWT (JSON Web Tokens) + bcryptjs |
| Testing | Jest, Supertest, React Testing Library |
| DevOps | Docker, Docker Compose, GitHub Actions CI |

---

## Project Structure

```
limi-dashboard/
├── .github/workflows/ci.yml       # GitHub Actions CI
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.ts   # Register, Login, Search users
│   │   │   ├── projectController.ts # Projects + Members CRUD
│   │   │   └── taskController.ts   # Tasks CRUD + Move
│   │   ├── middleware/auth.ts      # JWT middleware
│   │   ├── models/db.ts            # PostgreSQL pool + schema init
│   │   ├── routes/index.ts         # All API routes
│   │   ├── socket/index.ts         # Socket.io real-time events
│   │   ├── types/index.ts          # TypeScript types
│   │   └── index.ts                # Server entry point
│   ├── tests/
│   │   ├── auth.test.ts            # 5 auth tests
│   │   └── tasks.test.ts           # 5 task tests
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/axios.ts            # Axios with JWT interceptor
│   │   ├── components/
│   │   │   ├── Auth/AuthPage.tsx   # Login + Register
│   │   │   ├── Board/
│   │   │   │   ├── KanbanBoard.tsx      # Main board + real-time
│   │   │   │   ├── KanbanColumn.tsx     # Droppable column
│   │   │   │   ├── TaskCard.tsx         # Draggable task card
│   │   │   │   ├── AddTaskModal.tsx     # Create task modal
│   │   │   │   ├── TaskEditModal.tsx    # Edit task modal
│   │   │   │   ├── MembersPanel.tsx     # Add/remove members
│   │   │   │   └── EditProjectModal.tsx # Edit project modal
│   │   │   └── UI/ProtectedRoute.tsx
│   │   ├── hooks/useSocket.ts      # Socket.io hooks
│   │   ├── pages/Dashboard.tsx    # Main dashboard
│   │   ├── store/
│   │   │   ├── slices/authSlice.ts
│   │   │   ├── slices/projectSlice.ts  # + real-time actions
│   │   │   └── slices/taskSlice.ts     # + real-time actions
│   │   └── tests/AuthPage.test.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## Prerequisites

Install these on your computer:

**Node.js v18+** → https://nodejs.org (download LTS)

**Git** → https://git-scm.com/downloads

**Docker Desktop** *(only for Docker method)* → https://www.docker.com/products/docker-desktop

---

## Database Setup — Neon.tech (Free, No Install)

> **This is the recommended approach.** Neon.tech is like MongoDB Atlas but for PostgreSQL — free cloud database, no local install needed.

### Step 1 — Create Free Account
1. Go to **https://neon.tech**
2. Click **"Sign Up"** → use GitHub login (fastest)
3. Click **"Create a project"**
4. Project name: `limi-dashboard` → Region: any → Click **"Create project"**

### Step 2 — Get Connection String
After project is created, you will see a screen like:

```
Connection string:
postgresql://task:<password>@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

Click **"Copy"** on this connection string.

### Step 3 — Add to Backend .env
Open `backend/.env` and add this line (paste your copied string):

```env
DATABASE_URL=postgresql://wasi:yourpassword@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

That's it! The app will **automatically create all tables** on first run — you don't need to run any migrations manually.

> **Tip:** Keep the rest of the `.env` file as-is. `DATABASE_URL` takes priority over the individual `DB_HOST`, `DB_PORT` etc. variables.

---

## Local Setup (Manual)

### Step 1 — Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/limi-dashboard.git
cd limi-dashboard
```

### Step 2 — Backend setup
```bash
cd backend
npm install
```

Open `backend/.env` and add your Neon.tech `DATABASE_URL` (see above), then:

```bash
npm run dev
```

✅ You should see:
```
✅ Database initialized successfully
🚀 Server running on http://localhost:5000
```

### Step 3 — Frontend setup

Open a **new terminal** (keep backend running):

```bash
cd frontend
npm install
npm run dev
```

✅ You should see:
```
VITE ready
➜ Local: http://localhost:5173/
```

### Step 4 — Open in browser

**http://localhost:5173**

Register an account → Create a project → Start adding tasks!

---

## Docker Setup (One Command)

> Easiest method. Spins up backend + PostgreSQL + frontend with a single command.

### Step 1 — Make sure Docker Desktop is running
Open Docker Desktop and wait for the green "Engine running" status.

### Step 2 — Clone and start
```bash
git clone https://github.com/YOUR_USERNAME/limi-dashboard.git
cd limi-dashboard
docker-compose up --build
```

First run takes 3-5 minutes to download images. When ready you'll see:
```
limi_postgres  | database system is ready to accept connections
limi_backend   | ✅ Database initialized successfully
limi_backend   | 🚀 Server running on http://localhost:5000
```

### Step 3 — Open in browser

**http://localhost:5173**

### Docker Commands

```bash
# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop everything
docker-compose down

# Stop + delete database data (fresh start)
docker-compose down -v

# Restart without rebuilding
docker-compose up
```

> **Note for Docker:** When using docker-compose, the internal PostgreSQL is used automatically — you don't need Neon.tech for the Docker method.

---

## Running Tests

### Backend Tests (Jest + Supertest)

```bash
cd backend
npm install
npm test
```

Expected output:
```
PASS tests/auth.test.ts
  Auth Controller
    ✓ should return 400 if fields are missing
    ✓ should return 409 if email already exists
    ✓ should register successfully with valid data
    ✓ should return 400 if fields are missing (login)
    ✓ should return 401 for invalid credentials

PASS tests/tasks.test.ts
  Task Controller
    ✓ should return 401 without token
    ✓ should return tasks for a project
    ✓ should return 400 if title is missing
    ✓ should create a task successfully
    ✓ should move task to new status

Tests: 10 passed
```

### Frontend Tests (React Testing Library)

```bash
cd frontend
npm install
npm test
```

Expected output:
```
PASS src/tests/AuthPage.test.tsx
  AuthPage
    ✓ renders login form by default
    ✓ switches to register form when Sign up is clicked

Tests: 2 passed
```

---

## API Endpoints

All protected routes require: `Authorization: Bearer <token>`

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login, get JWT token |
| GET | `/api/auth/me` | ✅ | Get current user |
| GET | `/api/auth/search?email=x` | ✅ | Search users by email |

### Projects
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/projects` | ✅ | Get all projects (owned + member of) |
| POST | `/api/projects` | ✅ | Create project |
| PUT | `/api/projects/:id` | ✅ | Update project (owner only) |
| DELETE | `/api/projects/:id` | ✅ | Delete project (owner only) |

### Project Members
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/projects/:id/members` | ✅ | Get all project members |
| POST | `/api/projects/:id/members` | ✅ | Add member by email (owner only) |
| DELETE | `/api/projects/:id/members/:userId` | ✅ | Remove member (owner only) |

### Tasks
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/projects/:projectId/tasks` | ✅ | Get tasks for a project |
| POST | `/api/projects/:projectId/tasks` | ✅ | Create task |
| PUT | `/api/tasks/:id` | ✅ | Update task (title, description, status, assignee) |
| PATCH | `/api/tasks/:id/move` | ✅ | Move task to different column |
| DELETE | `/api/tasks/:id` | ✅ | Delete task |

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |

---

## Production Deployment

### Render (Backend) + Vercel (Frontend) — Both Free

#### 1. Deploy Backend on Render

1. Go to **render.com** → Sign up with GitHub
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo
4. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `node dist/index.js`
   - **Environment:** Node

5. Add Environment Variables:
```
DATABASE_URL=<your neon.tech connection string>
JWT_SECRET=your_strong_random_secret_here
CLIENT_URL=https://your-app.vercel.app
PORT=5000
```

6. Click **"Create Web Service"**
7. Wait ~3 min → Your backend URL: `https://limi-backend-xxxx.onrender.com`

#### 2. Deploy Frontend on Vercel

1. Go to **vercel.com** → Sign up with GitHub
2. Click **"New Project"** → Import your GitHub repo
3. Settings:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

4. Add Environment Variables:
```
VITE_API_URL=https://limi-backend-xxxx.onrender.com/api
VITE_SOCKET_URL=https://limi-backend-xxxx.onrender.com
```

5. Click **"Deploy"**
6. Your frontend URL: `https://limi-dashboard.vercel.app`

7. **Last step:** Go back to Render, update `CLIENT_URL` to your Vercel URL.

#### 3. Verify Deployment

- Frontend: `https://limi-dashboard.vercel.app`
- Backend health: `https://limi-backend-xxxx.onrender.com/health`

---

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000

# Option 1 — Neon.tech (recommended, no install)
DATABASE_URL=postgresql://user:pass@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# Option 2 — Local PostgreSQL (if installed)
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=limi_dashboard
# DB_USER=postgres
# DB_PASSWORD=your_password

JWT_SECRET=limi_super_secret_jwt_key_change_in_production
CLIENT_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Frontend Production (`frontend/.env.production`)

```env
VITE_API_URL=/api
VITE_SOCKET_URL=
```

---

## Troubleshooting

### ❌ "Database connection failed"
Make sure `DATABASE_URL` in `backend/.env` is correct. Test your Neon.tech connection string by pasting it into the Neon dashboard SQL editor.

### ❌ "npm install" fails
```bash
rm -rf node_modules package-lock.json
npm install
```

### ❌ Port already in use
```bash
# Mac/Linux
lsof -i :5000 | grep LISTEN && kill -9 <PID>
lsof -i :5173 | grep LISTEN && kill -9 <PID>

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### ❌ Docker "port already allocated"
```bash
docker-compose down
docker-compose up --build
```

### ❌ Real-time not working
- Make sure both frontend and backend are running
- Check `VITE_SOCKET_URL` points to your backend URL
- Check browser console for WebSocket errors

### ❌ "User not found" when adding member
The user must have already registered an account in the app. Share the app URL with your teammate and ask them to register first.

---

## Author

**Syed Wasi Ul Hassan**
Technical Assessment — Limi AI
Intern · Full Stack / React & Node.js Developer
