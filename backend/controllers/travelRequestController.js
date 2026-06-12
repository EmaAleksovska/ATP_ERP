import pool from '../config/database.js';
import { randomUUID } from 'crypto';
import { sendTravelRequestNotification, sendTravelOrderApproval, sendTravelRequestRejection } from '../services/emailService.js';
import { generateOrderNumber } from '../services/orderNumberService.js';
import { generateTravelOrderPDF } from '../services/pdfService.js';

// Get approved cities (cities from approved travel orders)
export const getApprovedCities = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT tr.location_city
       FROM travel_requests tr
       INNER JOIN travel_orders t_order ON tr.id = t_order.travel_request_id
       WHERE tr.location_city IS NOT NULL AND tr.location_city != ''
       ORDER BY tr.location_city ASC`
    );

    const cities = result.rows.map(row => row.location_city);

    res.json({
      success: true,
      cities: cities,
    });
  } catch (error) {
    next(error);
  }
};

// Submit travel request (user)
export const submitTravelRequest = async (req, res, next) => {
  try {
    const { projectId, locationCountry, locationCity, startDate, endDate, dailyAllowance, notes } =
      req.body;

    if (!projectId || !locationCity || !startDate || !endDate || !dailyAllowance) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    if (end < start) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Verify project exists
    const projectCheck = await pool.query(
      'SELECT id, name, responsible_user_id FROM projects WHERE id = ?',
      [projectId]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const project = projectCheck.rows[0];

    if (!project.responsible_user_id) {
      return res.status(400).json({ message: 'Project does not have a responsible user assigned' });
    }

    // Create travel request
    const requestId = randomUUID();
    // Use empty string as default for locationCountry if not provided
    const countryValue = locationCountry || '';
    const result = await pool.query(
      `INSERT INTO travel_requests 
       (id, user_id, project_id, location_country, location_city, start_date, end_date, daily_allowance, notes, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending') 
       RETURNING *`,
      [requestId, req.user.id, projectId, countryValue, locationCity, startDate, endDate, dailyAllowance, notes || null]
    );

    const travelRequest = result.rows[0];

    // Get responsible user details
    const responsibleUserResult = await pool.query(
      'SELECT email, first_name, last_name FROM users WHERE id = ?',
      [project.responsible_user_id]
    );

    if (responsibleUserResult.rows.length > 0) {
      const responsibleUser = responsibleUserResult.rows[0];

      // Get requester name
      const requesterResult = await pool.query(
        'SELECT first_name, last_name FROM users WHERE id = ?',
        [req.user.id]
      );
      const requesterName = requesterResult.rows[0]
        ? `${requesterResult.rows[0].first_name} ${requesterResult.rows[0].last_name}`
        : 'User';

      // Send email notification
      try {
        await sendTravelRequestNotification(
          responsibleUser.email,
          `${responsibleUser.first_name} ${responsibleUser.last_name}`,
          requesterName,
          project.name,
          locationCountry ? `${locationCity}, ${locationCountry}` : locationCity,
          startDate,
          endDate,
          travelRequest.id
        );
      } catch (emailError) {
        console.error('Error sending notification email:', emailError);
        // Continue even if email fails
      }
    }

    // Log action
    await pool.query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [
        req.user.id,
        'submit_travel_request',
        'travel_request',
        travelRequest.id,
        JSON.stringify({ project_id: projectId }),
      ]
    );

    res.status(201).json({
      success: true,
      travelRequest,
    });
  } catch (error) {
    next(error);
  }
};

// Get user's travel requests
export const getMyTravelRequests = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 
        tr.*,
        p.name as project_name,
        p.project_id,
        u.first_name as requester_first_name,
        u.last_name as requester_last_name
      FROM travel_requests tr
      JOIN projects p ON tr.project_id = p.id
      JOIN users u ON tr.user_id = u.id
      WHERE tr.user_id = ?
      ORDER BY tr.created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      travelRequests: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

// Get all travel requests (admin) or requests for responsible user's projects
export const getTravelRequests = async (req, res, next) => {
  try {
    let result;

    if (req.user.role === 'admin') {
      // Admin sees all requests
      result = await pool.query(
        `SELECT 
          tr.*,
          p.name as project_name,
          p.project_id,
          u.first_name as requester_first_name,
          u.last_name as requester_last_name
        FROM travel_requests tr
        JOIN projects p ON tr.project_id = p.id
        JOIN users u ON tr.user_id = u.id
        ORDER BY tr.created_at DESC`
      );
    } else {
      // Regular users see only their requests
      result = await pool.query(
        `SELECT 
          tr.*,
          p.name as project_name,
          p.project_id,
          u.first_name as requester_first_name,
          u.last_name as requester_last_name
        FROM travel_requests tr
        JOIN projects p ON tr.project_id = p.id
        JOIN users u ON tr.user_id = u.id
        WHERE tr.user_id = ?
        ORDER BY tr.created_at DESC`,
        [req.user.id]
      );
    }

    res.json({
      success: true,
      travelRequests: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

// Get travel requests for projects I'm responsible for
export const getRequestsForMyProjects = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 
        tr.*,
        p.name as project_name,
        p.project_id,
        u.first_name as requester_first_name,
        u.last_name as requester_last_name,
        u.email as requester_email
      FROM travel_requests tr
      JOIN projects p ON tr.project_id = p.id
      JOIN users u ON tr.user_id = u.id
      WHERE p.responsible_user_id = ?
      ORDER BY tr.created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      travelRequests: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

// Get travel request by ID
export const getTravelRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        tr.*,
        p.name as project_name,
        p.project_id,
        p.responsible_user_id,
        u.first_name as requester_first_name,
        u.last_name as requester_last_name,
        u.email as requester_email,
        resp.first_name as responsible_first_name,
        resp.last_name as responsible_last_name
      FROM travel_requests tr
      JOIN projects p ON tr.project_id = p.id
      JOIN users u ON tr.user_id = u.id
      LEFT JOIN users resp ON p.responsible_user_id = resp.id
      WHERE tr.id = ?`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Travel request not found' });
    }

    // Check permissions
    const request = result.rows[0];
    if (
      req.user.role !== 'admin' &&
      request.user_id !== req.user.id &&
      request.responsible_user_id !== req.user.id
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      success: true,
      travelRequest: request,
    });
  } catch (error) {
    next(error);
  }
};

// Approve travel request (responsible user)
export const approveTravelRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get travel request with project info
    const requestResult = await pool.query(
      `SELECT tr.*, p.responsible_user_id, p.name as project_name
       FROM travel_requests tr
       JOIN projects p ON tr.project_id = p.id
       WHERE tr.id = ?`,
      [id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ message: 'Travel request not found' });
    }

    const travelRequest = requestResult.rows[0];

    // Check if user is the responsible user for this project
    if (travelRequest.responsible_user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Only the responsible user for this project can approve requests',
      });
    }

    if (travelRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Request is not pending approval' });
    }

    // Update request status
    await pool.query('UPDATE travel_requests SET status = ? WHERE id = ?', ['approved', id]);

    // Generate order number
    const orderNumber = await generateOrderNumber();

    // Create travel order
    const orderId = randomUUID();
    const orderResult = await pool.query(
      `INSERT INTO travel_orders (id, travel_request_id, order_number, approved_by_id, approval_date)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
       RETURNING *`,
      [orderId, id, orderNumber, req.user.id]
    );

    const travelOrder = orderResult.rows[0];

    // Generate PDF
    let pdfPath;
    try {
      pdfPath = await generateTravelOrderPDF(id, orderNumber);
      console.log(`[DEBUG] PDF generated successfully at: ${pdfPath}`);
      
      // Verify PDF was actually created and path is stored
      if (pdfPath) {
        const fs = await import('fs');
        if (fs.existsSync(pdfPath)) {
          const stats = fs.statSync(pdfPath);
          console.log(`[DEBUG] PDF file verified: ${pdfPath}, Size: ${stats.size} bytes`);
        } else {
          console.warn(`[WARN] PDF path returned but file doesn't exist: ${pdfPath}`);
        }
        
        // Double-check database has the path
        const dbCheck = await pool.query(
          'SELECT pdf_path FROM travel_orders WHERE travel_request_id = ? AND order_number = ?',
          [id, orderNumber]
        );
        if (dbCheck.rows.length > 0) {
          console.log(`[DEBUG] PDF path in database: ${dbCheck.rows[0].pdf_path}`);
        }
      }
    } catch (pdfError) {
      console.error('[ERROR] ===== PDF Generation Failed =====');
      console.error('[ERROR] Error message:', pdfError.message);
      console.error('[ERROR] Error name:', pdfError.name);
      console.error('[ERROR] Error code:', pdfError.code);
      console.error('[ERROR] PDF Error stack:', pdfError.stack);
      console.error('[ERROR] Full error:', pdfError);
      console.error('[ERROR] ===================================');
      pdfPath = null;
      // Continue even if PDF generation fails - order is already created
    }

    // If PDF path is not available from generation, try to get it from database
    if (!pdfPath) {
      console.log(`[DEBUG] PDF path not available, checking database...`);
      const orderWithPdf = await pool.query(
        'SELECT pdf_path FROM travel_orders WHERE travel_request_id = ? AND order_number = ?',
        [id, orderNumber]
      );
      if (orderWithPdf.rows.length > 0 && orderWithPdf.rows[0].pdf_path) {
        pdfPath = orderWithPdf.rows[0].pdf_path;
        console.log(`[DEBUG] Retrieved PDF path from database: ${pdfPath}`);
      } else {
        console.warn(`[WARN] No PDF path found in database for order: ${orderNumber}`);
      }
    }

    // Get requester details - make sure we use the requester's ID, not the approver's
    console.log(`[DEBUG] Travel request user_id (requester): ${travelRequest.user_id}`);
    console.log(`[DEBUG] Approver user_id: ${req.user.id}`);
    
    const requesterResult = await pool.query(
      'SELECT email, first_name, last_name FROM users WHERE id = ?',
      [travelRequest.user_id]
    );

    if (requesterResult.rows.length > 0) {
      const requester = requesterResult.rows[0];
      const requesterName = `${requester.first_name} ${requester.last_name}`;
      
      console.log(`[DEBUG] Sending approval email to requester: ${requester.email} (${requesterName})`);

      // Send approval email with PDF (send even if PDF generation failed)
      try {
        console.log(`[DEBUG] Sending email with PDF path: ${pdfPath}`);
        await sendTravelOrderApproval(requester.email, requesterName, orderNumber, pdfPath);
      } catch (emailError) {
        console.error('Error sending approval email:', emailError);
        // Continue even if email fails
      }
    } else {
      console.error(`[ERROR] Requester not found for user_id: ${travelRequest.user_id}`);
    }

    // Log action
    await pool.query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [
        req.user.id,
        'approve_travel_request',
        'travel_request',
        id,
        JSON.stringify({ order_number: orderNumber }),
      ]
    );

    res.json({
      success: true,
      message: 'Travel request approved and order generated',
      travelOrder,
    });
  } catch (error) {
    next(error);
  }
};

// Reject travel request (responsible user)
export const rejectTravelRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    // Get travel request with project info
    const requestResult = await pool.query(
      `SELECT tr.*, p.responsible_user_id
       FROM travel_requests tr
       JOIN projects p ON tr.project_id = p.id
       WHERE tr.id = ?`,
      [id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ message: 'Travel request not found' });
    }

    const travelRequest = requestResult.rows[0];

    // Check if user is the responsible user for this project
    if (travelRequest.responsible_user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Only the responsible user for this project can reject requests',
      });
    }

    if (travelRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Request is not pending approval' });
    }

    // Update request status
    await pool.query('UPDATE travel_requests SET status = ? WHERE id = ?', ['rejected', id]);

    // Get requester details and project name for email
    const requesterResult = await pool.query(
      `SELECT u.email, u.first_name, u.last_name, p.name as project_name
       FROM travel_requests tr
       JOIN users u ON tr.user_id = u.id
       JOIN projects p ON tr.project_id = p.id
       WHERE tr.id = ?`,
      [id]
    );

    if (requesterResult.rows.length > 0) {
      const requester = requesterResult.rows[0];
      const requesterName = `${requester.first_name} ${requester.last_name}`;

      // Send rejection email
      try {
        await sendTravelRequestRejection(
          requester.email,
          requesterName,
          requester.project_name,
          rejectionReason || null
        );
      } catch (emailError) {
        console.error('Error sending rejection email:', emailError);
        // Continue even if email fails
      }
    }

    // Log action
    await pool.query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
      [
        req.user.id,
        'reject_travel_request',
        'travel_request',
        id,
        JSON.stringify({ reason: rejectionReason || 'No reason provided' }),
      ]
    );

    res.json({
      success: true,
      message: 'Travel request rejected',
    });
  } catch (error) {
    next(error);
  }
};

