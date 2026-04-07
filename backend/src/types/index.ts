export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  created_at: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_at: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  project_id: string;
  assignee_id: string | null;
  position: number;
  created_at: Date;
  updated_at: Date;
}

export interface AuthRequest extends Request {
  user?: { id: string; email: string; name: string };
}

export interface JwtPayload {
  id: string;
  email: string;
  name: string;
}
