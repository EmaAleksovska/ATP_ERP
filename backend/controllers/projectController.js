import pool from '../config/database.js';
import { randomUUID } from 'crypto';

// Get all projects
export const getAllProjects = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 
        p.id, 
        p.name, 
        p.description, 
        p.client_code,
        p.project_id, 
        p.responsible_user_id,
        p.created_at,
        p.updated_at,
        u.first_name as responsible_first_name,
        u.last_name as responsible_last_name,
        u.email as responsible_email
      FROM projects p
      LEFT JOIN users u ON p.responsible_user_id = u.id
      ORDER BY p.created_at DESC`
    );

    res.json({
      success: true,
      projects: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

// Get project by ID
export const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        p.id, 
        p.name, 
        p.description, 
        p.client_code,
        p.project_id, 
        p.responsible_user_id,
        p.created_at,
        p.updated_at,
        u.first_name as responsible_first_name,
        u.last_name as responsible_last_name,
        u.email as responsible_email
      FROM projects p
      LEFT JOIN users u ON p.responsible_user_id = u.id
      WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({
      success: true,
      project: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Create project (admin only)
export const createProject = async (req, res, next) => {
  try {
    const { name, description, clientCode, projectId, responsibleUserId } = req.body;

    if (!name || !projectId) {
      return res.status(400).json({ message: 'Name and Project ID are required' });
    }

    // Check if project ID already exists
    const projectIdCheck = await pool.query('SELECT id FROM projects WHERE project_id = $1', [
      projectId,
    ]);

    if (projectIdCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Project ID already exists' });
    }

    // Verify responsible user exists if provided
    if (responsibleUserId) {
      const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [
        responsibleUserId,
      ]);

      if (userCheck.rows.length === 0) {
        return res.status(400).json({ message: 'Responsible user not found' });
      }
    }

    const projectUuid = randomUUID();
    const result = await pool.query(
      `INSERT INTO projects (id, name, description, client_code, project_id, responsible_user_id) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, name, description, client_code, project_id, responsible_user_id, created_at`,
      [projectUuid, name, description || null, clientCode || null, projectId, responsibleUserId || null]
    );

    const newProject = result.rows[0];

    // Log action
    await pool.query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
      [
        req.user.id,
        'create_project',
        'project',
        newProject.id,
        JSON.stringify({ name: newProject.name, project_id: newProject.project_id }),
      ]
    );

    res.status(201).json({
      success: true,
      project: newProject,
    });
  } catch (error) {
    next(error);
  }
};

// Update project (admin only)
export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, clientCode, projectId, responsibleUserId } = req.body;

    // Check if project exists
    const projectCheck = await pool.query('SELECT id, project_id FROM projects WHERE id = $1', [
      id,
    ]);

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if project ID is being changed and if new ID already exists
    if (projectId && projectId !== projectCheck.rows[0].project_id) {
      const projectIdCheck = await pool.query(
        'SELECT id FROM projects WHERE project_id = $1 AND id != $2',
        [projectId, id]
      );

      if (projectIdCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Project ID already exists' });
      }
    }

    // Verify responsible user exists if provided (and not null/empty)
    if (responsibleUserId !== undefined && responsibleUserId !== null && responsibleUserId !== '') {
      const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [
        responsibleUserId,
      ]);

      if (userCheck.rows.length === 0) {
        return res.status(400).json({ message: 'Responsible user not found' });
      }
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (clientCode !== undefined) {
      updates.push(`client_code = $${paramCount++}`);
      values.push(clientCode || null);
    }
    if (projectId) {
      updates.push(`project_id = $${paramCount++}`);
      values.push(projectId);
    }
    if (responsibleUserId !== undefined) {
      // Allow setting to null to clear the responsible user
      updates.push(`responsible_user_id = $${paramCount++}`);
      values.push(responsibleUserId || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE projects SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, name, description, client_code, project_id, responsible_user_id, updated_at`;

    const result = await pool.query(query, values);

    // Log action
    await pool.query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'update_project', 'project', id, JSON.stringify(req.body)]
    );

    res.json({
      success: true,
      project: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Delete project (admin only)
export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if project exists
    const projectCheck = await pool.query('SELECT id, name FROM projects WHERE id = $1', [id]);

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if project has travel requests
    const requestsCheck = await pool.query(
      'SELECT id FROM travel_requests WHERE project_id = $1 LIMIT 1',
      [id]
    );

    if (requestsCheck.rows.length > 0) {
      return res
        .status(400)
        .json({ message: 'Cannot delete project with existing travel requests' });
    }

    // Delete project
    await pool.query('DELETE FROM projects WHERE id = $1', [id]);

    // Log action
    await pool.query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
      [
        req.user.id,
        'delete_project',
        'project',
        id,
        JSON.stringify({ name: projectCheck.rows[0].name }),
      ]
    );

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

