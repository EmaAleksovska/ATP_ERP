import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../config/database.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// Login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const result = await pool.query(
      'SELECT id, email, password_hash, role, status, first_name, last_name FROM users WHERE email = ?',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    if (user.status !== 'active') {
      return res.status(401).json({ message: 'Account is inactive' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    // Log login action
    await pool.query(
      'INSERT INTO audit_log (user_id, action, entity_type, details) VALUES (?, ?, ?, ?)',
      [user.id, 'login', 'user', JSON.stringify({ email: user.email })]
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
export const getCurrentUser = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, email, role, first_name, last_name, status FROM users WHERE id = ?',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Forgot password
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const result = await pool.query('SELECT id, email, first_name FROM users WHERE email = ?', [
      email.toLowerCase(),
    ]);

    // Don't reveal if email exists or not (security best practice)
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    const user = result.rows[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    // Delete any existing tokens for this user
    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = ?', [user.id]);

    // Generate UUID for reset token
    const { randomUUID } = await import('crypto');
    const resetTokenId = randomUUID();

    // Save new token
    await pool.query(
      'INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
      [resetTokenId, user.id, resetToken, expiresAt]
    );

    // Send email
    try {
      await sendPasswordResetEmail(user.email, user.first_name, resetToken);
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      // Continue anyway - don't reveal email service issues
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

// Reset password
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    // Find valid token
    const tokenResult = await pool.query(
      'SELECT user_id, expires_at FROM password_reset_tokens WHERE token = ?',
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const tokenData = tokenResult.rows[0];

    if (new Date() > new Date(tokenData.expires_at)) {
      await pool.query('DELETE FROM password_reset_tokens WHERE token = ?', [token]);
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [
      hashedPassword,
      tokenData.user_id,
    ]);

    // Delete used token
    await pool.query('DELETE FROM password_reset_tokens WHERE token = ?', [token]);

    // Log password reset
    await pool.query(
      'INSERT INTO audit_log (user_id, action, entity_type, details) VALUES (?, ?, ?, ?)',
      [tokenData.user_id, 'password_reset', 'user', JSON.stringify({ method: 'reset_token' })]
    );

    res.json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    next(error);
  }
};

