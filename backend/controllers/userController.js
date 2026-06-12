import bcrypt from 'bcryptjs';
import pool from '../config/database.js';

// Get all users (admin only)
export const getAllUsers = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, role, status, created_at, updated_at 
       FROM users 
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      users: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

// Get user by ID
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, first_name, last_name, email, role, status, created_at, updated_at 
       FROM users 
       WHERE id = ?`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Create user (admin only)
export const createUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role, status } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    // Check if email already exists
    const emailCheck = await pool.query('SELECT id FROM users WHERE email = ?', [
      email.toLowerCase(),
    ]);

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate UUID for new user
    const { randomUUID } = await import('crypto');
    const newUserId = randomUUID();
    
    // Insert user
    const result = await pool.query(
      `INSERT INTO users (id, first_name, last_name, email, password_hash, role, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?) 
       RETURNING id, first_name, last_name, email, role, status, created_at`,
      [
        newUserId,
        firstName,
        lastName,
        email.toLowerCase(),
        passwordHash,
        role || 'user',
        status || 'active',
      ]
    );

    const newUser = result.rows[0];

    // Log action
    await pool.query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [
        req.user.id,
        'create_user',
        'user',
        newUser.id,
        JSON.stringify({ email: newUser.email, role: newUser.role }),
      ]
    );

    res.status(201).json({
      success: true,
      user: newUser,
    });
  } catch (error) {
    next(error);
  }
};

// Update user (admin only)
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, role, status } = req.body;

    // Check if user exists
    const userCheck = await pool.query('SELECT id, email FROM users WHERE id = ?', [id]);

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if new email already exists
    if (email && email.toLowerCase() !== userCheck.rows[0].email) {
      const emailCheck = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [
        email.toLowerCase(),
        id,
      ]);

      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (firstName) {
      updates.push(`first_name = ?`);
      values.push(firstName);
    }
    if (lastName) {
      updates.push(`last_name = ?`);
      values.push(lastName);
    }
    if (email) {
      updates.push(`email = ?`);
      values.push(email.toLowerCase());
    }
    if (role) {
      updates.push(`role = ?`);
      values.push(role);
    }
    if (status) {
      updates.push(`status = ?`);
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ? RETURNING id, first_name, last_name, email, role, status, updated_at`;

    const result = await pool.query(query, values);

    // Log action
    await pool.query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'update_user', 'user', id, JSON.stringify(req.body)]
    );

    res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Delete user (admin only)
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT id, email FROM users WHERE id = ?', [id]);

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user
    await pool.query('DELETE FROM users WHERE id = ?', [id]);

    // Log action
    await pool.query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [
        req.user.id,
        'delete_user',
        'user',
        id,
        JSON.stringify({ email: userCheck.rows[0].email }),
      ]
    );

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Update user status (activate/deactivate)
export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Valid status (active/inactive) is required' });
    }

    // Prevent deactivating yourself
    if (id === req.user.id && status === 'inactive') {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }

    const result = await pool.query(
      'UPDATE users SET status = ? WHERE id = ? RETURNING id, email, status',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log action
    await pool.query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'update_user_status', 'user', id, JSON.stringify({ status })]
    );

    res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

