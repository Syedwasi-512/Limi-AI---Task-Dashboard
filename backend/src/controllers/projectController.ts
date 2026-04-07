import { Response } from 'express';
import { pool } from '../models/db';
import { AuthRequest } from '../middleware/auth';

export const getProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.name as owner_name,
        (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) + 1 as member_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count
       FROM projects p
       JOIN users u ON p.owner_id = u.id
       WHERE p.owner_id = $1
         OR p.id IN (SELECT project_id FROM project_members WHERE user_id = $1)
       ORDER BY p.created_at DESC`,
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, description } = req.body;
  if (!name) { res.status(400).json({ error: 'Project name is required' }); return; }
  try {
    const result = await pool.query(
      'INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description || '', req.user!.id]
    );
    res.status(201).json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to create project' });
  }
};

export const updateProject = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, description } = req.body;
  if (!name?.trim()) { res.status(400).json({ error: 'Project name is required' }); return; }
  try {
    const check = await pool.query('SELECT id FROM projects WHERE id = $1 AND owner_id = $2', [id, req.user!.id]);
    if (check.rows.length === 0) { res.status(403).json({ error: 'Only owner can update project' }); return; }
    const result = await pool.query(
      'UPDATE projects SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name.trim(), description || '', id]
    );
    res.json(result.rows[0]);
  } catch {
    res.status(500).json({ error: 'Failed to update project' });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const check = await pool.query('SELECT id FROM projects WHERE id = $1 AND owner_id = $2', [id, req.user!.id]);
    if (check.rows.length === 0) { res.status(403).json({ error: 'Only owner can delete project' }); return; }
    // Get all member IDs before deleting (for real-time notification)
    const membersResult = await pool.query('SELECT user_id FROM project_members WHERE project_id = $1', [id]);
    await pool.query('DELETE FROM projects WHERE id = $1', [id]);
    res.json({ message: 'Project deleted', memberIds: membersResult.rows.map((r: any) => r.user_id) });
  } catch {
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

// ── Members ──────────────────────────────────────────────
export const getMembers = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, 'owner' as role, p.created_at as joined_at
       FROM projects p JOIN users u ON p.owner_id = u.id WHERE p.id = $1
       UNION
       SELECT u.id, u.name, u.email, pm.role, pm.joined_at
       FROM project_members pm JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = $1
       ORDER BY role DESC, name ASC`,
      [id]
    );
    res.json(result.rows);
  } catch {
    res.status(500).json({ error: 'Failed to fetch members' });
  }
};

export const addMember = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { email, role } = req.body;
  if (!email) { res.status(400).json({ error: 'Email is required' }); return; }
  try {
    const ownerCheck = await pool.query('SELECT id FROM projects WHERE id = $1 AND owner_id = $2', [id, req.user!.id]);
    if (ownerCheck.rows.length === 0) { res.status(403).json({ error: 'Only project owner can add members' }); return; }

    const userResult = await pool.query('SELECT id, name, email FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (userResult.rows.length === 0) { res.status(404).json({ error: 'No user found with this email' }); return; }

    const userToAdd = userResult.rows[0];
    const isOwner = await pool.query('SELECT id FROM projects WHERE id = $1 AND owner_id = $2', [id, userToAdd.id]);
    if (isOwner.rows.length > 0) { res.status(409).json({ error: 'This user is already the project owner' }); return; }

    const dupCheck = await pool.query('SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2', [id, userToAdd.id]);
    if (dupCheck.rows.length > 0) { res.status(409).json({ error: 'User is already a member' }); return; }

    await pool.query('INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)', [id, userToAdd.id, role || 'member']);
    res.status(201).json({ ...userToAdd, role: role || 'member', joined_at: new Date() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add member' });
  }
};

export const removeMember = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id, userId } = req.params;
  try {
    const ownerCheck = await pool.query('SELECT id FROM projects WHERE id = $1 AND owner_id = $2', [id, req.user!.id]);
    if (ownerCheck.rows.length === 0) { res.status(403).json({ error: 'Only project owner can remove members' }); return; }
    const result = await pool.query('DELETE FROM project_members WHERE project_id = $1 AND user_id = $2 RETURNING user_id', [id, userId]);
    if (result.rows.length === 0) { res.status(404).json({ error: 'Member not found' }); return; }
    res.json({ message: 'Member removed', userId });
  } catch {
    res.status(500).json({ error: 'Failed to remove member' });
  }
};
