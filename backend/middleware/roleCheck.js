export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};

export const requireResponsibleUser = async (req, res, next) => {
  try {
    // For approval/rejection routes, the ID in params is the travel request ID
    const travelRequestId = req.params.id;

    if (!travelRequestId) {
      return res.status(400).json({ message: 'Travel Request ID required' });
    }

    const pool = (await import('../config/database.js')).default;
    
    // Get project_id from travel request
    const requestResult = await pool.query(
      'SELECT project_id FROM travel_requests WHERE id = $1',
      [travelRequestId]
    );
    
    if (requestResult.rows.length === 0) {
      return res.status(404).json({ message: 'Travel request not found' });
    }

    const projectId = requestResult.rows[0].project_id;

    const projectResult = await pool.query(
      'SELECT responsible_user_id FROM projects WHERE id = $1',
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const responsibleUserId = projectResult.rows[0].responsible_user_id;

    if (!responsibleUserId) {
      return res.status(400).json({ message: 'Project does not have a responsible user assigned' });
    }

    // Allow admin or the responsible user
    if (responsibleUserId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the responsible user for this project can perform this action' });
    }

    next();
  } catch (error) {
    console.error('Error checking project responsibility:', error);
    res.status(500).json({ message: 'Error checking project responsibility' });
  }
};

