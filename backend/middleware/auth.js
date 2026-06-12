import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user still exists and is active
    const result = await pool.query(
      'SELECT id, email, role, status FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (result.rows[0].status !== 'active') {
      return res.status(401).json({ message: 'Account is inactive' });
    }

    req.user = {
      id: result.rows[0].id,
      email: result.rows[0].email,
      role: result.rows[0].role
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(500).json({ message: 'Authentication error' });
  }
};

