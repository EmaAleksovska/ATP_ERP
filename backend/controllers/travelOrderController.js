import pool from '../config/database.js';
import fs from 'fs';
import path from 'path';

// Get user's travel orders
export const getMyTravelOrders = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 
        t_order.*,
        tr.location_country,
        tr.location_city,
        tr.start_date,
        tr.end_date,
        tr.daily_allowance,
        p.name as project_name,
        p.project_id,
        approver.first_name as approver_first_name,
        approver.last_name as approver_last_name
      FROM travel_orders t_order
      JOIN travel_requests tr ON t_order.travel_request_id = tr.id
      JOIN projects p ON tr.project_id = p.id
      JOIN users approver ON t_order.approved_by_id = approver.id
      WHERE tr.user_id = ?
      ORDER BY t_order.created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      travelOrders: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

// Get travel order by ID
export const getTravelOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        t_order.*,
        tr.location_country,
        tr.location_city,
        tr.start_date,
        tr.end_date,
        tr.daily_allowance,
        tr.notes,
        tr.user_id as requester_id,
        p.name as project_name,
        p.project_id,
        requester.first_name as requester_first_name,
        requester.last_name as requester_last_name,
        approver.first_name as approver_first_name,
        approver.last_name as approver_last_name
      FROM travel_orders t_order
      JOIN travel_requests tr ON t_order.travel_request_id = tr.id
      JOIN projects p ON tr.project_id = p.id
      JOIN users requester ON tr.user_id = requester.id
      JOIN users approver ON t_order.approved_by_id = approver.id
      WHERE t_order.id = ?`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Travel order not found' });
    }

    const order = result.rows[0];

    // Check permissions (user can only see their own orders, admin can see all)
    if (req.user.role !== 'admin' && order.requester_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      success: true,
      travelOrder: order,
    });
  } catch (error) {
    next(error);
  }
};

// Download travel order PDF
export const downloadTravelOrderPDF = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT t_order.*, tr.user_id as requester_id
       FROM travel_orders t_order
       JOIN travel_requests tr ON t_order.travel_request_id = tr.id
       WHERE t_order.id = ?`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Travel order not found' });
    }

    const order = result.rows[0];

    // Check permissions
    if (req.user.role !== 'admin' && order.requester_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!order.pdf_path || !fs.existsSync(order.pdf_path)) {
      return res.status(404).json({ message: 'PDF file not found' });
    }

    const fileName = `${order.order_number}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const fileStream = fs.createReadStream(order.pdf_path);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

