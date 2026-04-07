import { Response } from 'express';
import { pool } from '../models/db';
import { AuthRequest } from '../middleware/auth';

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const { projectId } = req.params;
  const { title, description, status, assignee_id } = req.body;

  if (!title) { 
    res.status(400).json({ error: 'Task title is required' }); 
    return; 
  }

  try {
    // 1. Position calculate karein
    const posResult = await pool.query(
      'SELECT COUNT(*) FROM tasks WHERE project_id = $1 AND status = $2',
      [projectId, status || 'todo']
    );
    const position = parseInt(posResult.rows[0].count) || 0;

    // 2. Task insert karein
    const result = await pool.query(
      `INSERT INTO tasks (title, description, status, project_id, assignee_id, position)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, description || '', status || 'todo', projectId, assignee_id || null, position]
    );

    if (result.rows && result.rows.length > 0) {
      const full = await pool.query(
        `SELECT t.*, u.name as assignee_name FROM tasks t
         LEFT JOIN users u ON t.assignee_id = u.id WHERE t.id = $1`,
        [result.rows[0].id]
      );


      const dataToSend = (full && full.rows && full.rows.length > 0) ? full.rows[0] : result.rows[0];
      res.status(201).json(dataToSend);
    } else {
      res.status(500).json({ error: 'Failed to retrieve created task' });
    }

  } catch (err) {
    console.error("CRITICAL ERROR IN CREATE_TASK:", err);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { title, description, status, assignee_id } = req.body;
  try {
    await pool.query(
      `UPDATE tasks SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        status = COALESCE($3, status),
        assignee_id = $4,
        updated_at = NOW()
       WHERE id = $5`,
      [title, description, status, assignee_id || null, id]
    );
    const full = await pool.query(
      `SELECT t.*, u.name as assignee_name FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id WHERE t.id = $1`,
      [id]
    );
    if (full.rows.length === 0) { res.status(404).json({ error: 'Task not found' }); return; }
    res.json(full.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
};

export const moveTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, position } = req.body;
  try {
    await pool.query(
      'UPDATE tasks SET status=$1, position=$2, updated_at=NOW() WHERE id=$3',
      [status, position, id]
    );
    const full = await pool.query(
      `SELECT t.*, u.name as assignee_name FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id WHERE t.id = $1`,
      [id]
    );
    if (full.rows.length === 0) { res.status(404).json({ error: 'Task not found' }); return; }
    res.json(full.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to move task' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
};
