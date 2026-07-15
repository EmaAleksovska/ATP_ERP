import pool from '../config/database.js';
import { randomUUID } from 'crypto';
import fs from 'fs';
import {
  validateCorrespondencePayload,
  mapCorrespondenceRow,
  decodePdfPayload,
  isDraftRow,
  DRAFT_PROJECT_ID,
  DRAFT_CLIENT,
  DRAFT_TYPE,
  parseEuropeanDate,
} from '../utils/correspondenceUtils.js';
import {
  saveCorrespondencePdf,
  deleteCorrespondencePdf,
} from '../services/correspondenceFileService.js';
import { UNIFIED_TABLE } from '../utils/migrateInputCorrespondenceTable.js';
import { resolveProjectRefId } from '../utils/migrateCorrespondenceProjectRef.js';
import { foldCase } from '../utils/foldCase.js';

const SELECT_FIELDS = `
  c.*,
  u.first_name as sender_first_name,
  u.last_name as sender_last_name,
  p.project_id as project_business_id
`;

const FROM_JOINS = `
  FROM ${UNIFIED_TABLE} c
  LEFT JOIN users u ON c.sender = u.id
  LEFT JOIN projects p ON c.project_id = p.id
`;

function matchesCase(record, caseInOut) {
  return !caseInOut || record.case_in_out === caseInOut;
}

async function getProjectResponsibleUserId(projectRefId) {
  const result = await pool.query(
    'SELECT responsible_user_id FROM projects WHERE id = ?',
    [projectRefId]
  );
  return result.rows[0]?.responsible_user_id || null;
}

async function assertResponsibleUser(req, projectId) {
  const responsibleUserId = await getProjectResponsibleUserId(projectId);
  if (!responsibleUserId || responsibleUserId !== req.user.id) {
    const error = new Error('You are not the responsible user! Exit');
    error.status = 403;
    throw error;
  }
}

async function computeNumbers(caseInOut, projectId, excludeId = null) {
  let numberSql = `
    SELECT COUNT(*) as cnt FROM ${UNIFIED_TABLE}
    WHERE project_id = ? AND project_id != ? AND case_in_out = ?
  `;
  const numberParams = [projectId, DRAFT_PROJECT_ID, caseInOut];
  if (excludeId) {
    numberSql += ' AND id != ?';
    numberParams.push(excludeId);
  }
  const numberResult = await pool.query(numberSql, numberParams);
  const number = Number(numberResult.rows[0]?.cnt || 0) + 1;

  let totalSql = `
    SELECT COUNT(*) as cnt FROM ${UNIFIED_TABLE}
    WHERE project_id != ? AND case_in_out = ?
  `;
  const totalParams = [DRAFT_PROJECT_ID, caseInOut];
  if (excludeId) {
    totalSql += ' AND id != ?';
    totalParams.push(excludeId);
  }
  const totalResult = await pool.query(totalSql, totalParams);
  const totalNumber = Number(totalResult.rows[0]?.cnt || 0) + 1;

  return { number, totalNumber };
}

function includesFolded(haystack, needle) {
  if (!needle) return true;
  return foldCase(haystack).includes(foldCase(needle));
}

function rowMatchesTextFilters(row, textFilters) {
  if (textFilters.projectId && !includesFolded(row.project_business_id || '', textFilters.projectId)) {
    return false;
  }
  if (textFilters.type && !includesFolded(row.type || '', textFilters.type)) {
    return false;
  }
  if (textFilters.client && !includesFolded(row.client || '', textFilters.client)) {
    return false;
  }
  if (textFilters.sender) {
    const senderName = [row.sender_first_name, row.sender_last_name].filter(Boolean).join(' ');
    if (!includesFolded(senderName, textFilters.sender)) {
      return false;
    }
  }
  return true;
}

function buildListQuery(filters) {
  const conditions = ['c.case_in_out = ?', "c.project_id != ?"];
  const params = [];

  if (filters.caseInOut) params.push(filters.caseInOut);
  params.push(DRAFT_PROJECT_ID);

  const textFilters = {
    projectId: filters.projectId ? String(filters.projectId).trim() : '',
    type: filters.type ? String(filters.type).trim() : '',
    client: filters.client ? String(filters.client).trim() : '',
    sender: filters.sender ? String(filters.sender).trim() : '',
  };

  if (filters.number !== undefined && filters.number !== '') {
    conditions.push('c.number = ?');
    params.push(Number(filters.number));
  }
  if (filters.date) {
    try {
      const iso = parseEuropeanDate(String(filters.date));
      conditions.push('c.correspondence_date = ?');
      params.push(iso);
    } catch {
      // ignore invalid filter date
    }
  }

  const sql = `
    SELECT ${SELECT_FIELDS}
    ${FROM_JOINS}
    WHERE ${conditions.join(' AND ')}
    ORDER BY c.correspondence_date DESC, c.number DESC
  `;

  return { sql, params, textFilters };
}

export function createCorrespondenceController(caseInOut, entityType, uploadSubdir) {
  const getByIdQuery = `
    SELECT ${SELECT_FIELDS}
    ${FROM_JOINS}
    WHERE c.id = ?
  `;

  return {
    getAll: async (req, res, next) => {
      try {
        const { sql, params, textFilters } = buildListQuery({
          caseInOut,
          projectId: req.query.project_id || req.query.projectId,
          type: req.query.type,
          number: req.query.number,
          client: req.query.client,
          sender: req.query.sender,
          date: req.query.date,
        });
        const result = await pool.query(sql, params);
        const rows = result.rows.filter((row) => rowMatchesTextFilters(row, textFilters));
        res.json({
          success: true,
          correspondence: rows.map(mapCorrespondenceRow),
        });
      } catch (error) {
        next(error);
      }
    },

    getNumbers: async (req, res, next) => {
      try {
        const rawProjectId = String(req.query.projectId || req.query.project_id || '').trim();
        if (!rawProjectId) {
          return res.status(400).json({ message: 'projectId is required' });
        }
        const projectId = await resolveProjectRefId(rawProjectId);
        if (!projectId) {
          return res.status(400).json({ message: 'Invalid projectId' });
        }
        const excludeId = req.query.excludeId || req.query.exclude_id || null;
        const numbers = await computeNumbers(caseInOut, projectId, excludeId);
        res.json({ success: true, ...numbers });
      } catch (error) {
        next(error);
      }
    },

    create: async (req, res, next) => {
      try {
        const { errors, data } = validateCorrespondencePayload(req.body);
        if (errors.length > 0) {
          return res.status(400).json({ message: errors.join(', ') });
        }

        const resolvedProjectId = await resolveProjectRefId(data.project_id);
        if (!resolvedProjectId) {
          return res.status(400).json({ message: 'Invalid projectId' });
        }
        data.project_id = resolvedProjectId;

        if (!data.sender) {
          data.sender = req.user.id;
        }

        const id = randomUUID();
        const recordData = {
          ...data,
          case_in_out: caseInOut,
        };

        if (req.body.pdf) {
          try {
            const pdfBuffer = decodePdfPayload(req.body);
            recordData.pdf_path = saveCorrespondencePdf(uploadSubdir, id, pdfBuffer);
          } catch (error) {
            return res.status(400).json({ message: error.message });
          }
        }

        const columns = Object.keys(recordData);
        const values = Object.values(recordData);
        const placeholders = columns.map(() => '?').join(', ');

        await pool.query(
          `INSERT INTO ${UNIFIED_TABLE} (id, ${columns.join(', ')})
           VALUES (?, ${placeholders})`,
          [id, ...values]
        );

        const created = await pool.query(getByIdQuery, [id]);
        res.status(201).json({
          success: true,
          correspondence: mapCorrespondenceRow(created.rows[0]),
        });
      } catch (error) {
        next(error);
      }
    },

    getById: async (req, res, next) => {
      try {
        const { id } = req.params;
        const result = await pool.query(getByIdQuery, [id]);

        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Correspondence record not found' });
        }

        const record = result.rows[0];
        if (!matchesCase(record, caseInOut)) {
          return res.status(404).json({ message: 'Correspondence record not found' });
        }

        res.json({
          success: true,
          correspondence: mapCorrespondenceRow(record),
        });
      } catch (error) {
        next(error);
      }
    },

    checkEditPermission: async (req, res, next) => {
      try {
        const { id } = req.params;
        const existing = await pool.query(`SELECT * FROM ${UNIFIED_TABLE} WHERE id = ?`, [id]);

        if (existing.rows.length === 0) {
          return res.status(404).json({ message: 'Such letter does not exist! Exit' });
        }

        const record = existing.rows[0];
        if (!matchesCase(record, caseInOut) || isDraftRow(record)) {
          return res.status(404).json({ message: 'Such letter does not exist! Exit' });
        }

        try {
          await assertResponsibleUser(req, record.project_id);
        } catch (err) {
          return res.status(err.status || 403).json({ message: err.message });
        }

        res.json({ success: true, allowed: true });
      } catch (error) {
        next(error);
      }
    },

    update: async (req, res, next) => {
      try {
        const { id } = req.params;
        const existing = await pool.query(`SELECT * FROM ${UNIFIED_TABLE} WHERE id = ?`, [id]);

        if (existing.rows.length === 0) {
          return res.status(404).json({ message: 'Correspondence record not found' });
        }

        const record = existing.rows[0];
        if (!matchesCase(record, caseInOut)) {
          return res.status(404).json({ message: 'Correspondence record not found' });
        }

        const isDraft = isDraftRow(record);
        const isFinalize = isDraft || req.body.finalize === true;

        if (!isFinalize) {
          try {
            await assertResponsibleUser(req, record.project_id);
          } catch (err) {
            return res.status(err.status || 403).json({ message: err.message });
          }
        } else if (record.sender !== req.user.id) {
          return res.status(403).json({ message: 'Access denied' });
        }

        const { errors, data } = validateCorrespondencePayload(req.body, {
          isUpdate: !isFinalize,
          isFinalize,
        });
        if (errors.length > 0) {
          return res.status(400).json({ message: errors.join(', ') });
        }

        if (!isFinalize) {
          const allowed = ['type', 'description', 'correspondence_date', 'sender'];
          Object.keys(data).forEach((key) => {
            if (!allowed.includes(key)) delete data[key];
          });
        }

        if (req.body.pdf) {
          try {
            const pdfBuffer = decodePdfPayload(req.body);
            if (record.pdf_path) deleteCorrespondencePdf(record.pdf_path);
            data.pdf_path = saveCorrespondencePdf(uploadSubdir, id, pdfBuffer);
          } catch (error) {
            return res.status(400).json({ message: error.message });
          }
        }

        const entries = Object.entries(data);
        if (entries.length === 0) {
          return res.status(400).json({ message: 'No valid fields to update' });
        }

        const setClause = entries.map(([key]) => `${key} = ?`).join(', ');
        const values = entries.map(([, value]) => value);

        await pool.query(
          `UPDATE ${UNIFIED_TABLE} SET ${setClause} WHERE id = ?`,
          [...values, id]
        );

        const updated = await pool.query(getByIdQuery, [id]);
        res.json({
          success: true,
          correspondence: mapCorrespondenceRow(updated.rows[0]),
        });
      } catch (error) {
        next(error);
      }
    },

    delete: async (req, res, next) => {
      try {
        const { id } = req.params;
        const existing = await pool.query(`SELECT * FROM ${UNIFIED_TABLE} WHERE id = ?`, [id]);

        if (existing.rows.length === 0) {
          return res.status(404).json({ message: 'Correspondence record not found' });
        }

        const record = existing.rows[0];
        if (!matchesCase(record, caseInOut)) {
          return res.status(404).json({ message: 'Correspondence record not found' });
        }

        const isDraft = isDraftRow(record);
        if (isDraft) {
          if (record.sender !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
          }
        } else if (req.query.draftOnly === 'true') {
          return res.status(400).json({ message: 'Cannot delete finalized record as draft' });
        }

        deleteCorrespondencePdf(record.pdf_path);
        await pool.query(`DELETE FROM ${UNIFIED_TABLE} WHERE id = ?`, [id]);

        res.json({ success: true, message: 'Correspondence record deleted' });
      } catch (error) {
        next(error);
      }
    },

    uploadPdf: async (req, res, next) => {
      try {
        const { id } = req.params;

        let pdfBuffer;
        try {
          pdfBuffer = decodePdfPayload(req.body);
        } catch (error) {
          return res.status(400).json({ message: error.message });
        }

        const existing = await pool.query(`SELECT * FROM ${UNIFIED_TABLE} WHERE id = ?`, [id]);

        if (existing.rows.length === 0) {
          return res.status(404).json({ message: 'Correspondence record not found' });
        }

        const record = existing.rows[0];
        if (!matchesCase(record, caseInOut)) {
          return res.status(404).json({ message: 'Correspondence record not found' });
        }

        if (!isDraftRow(record)) {
          try {
            await assertResponsibleUser(req, record.project_id);
          } catch (err) {
            return res.status(err.status || 403).json({ message: err.message });
          }
        } else if (record.sender !== req.user.id) {
          return res.status(403).json({ message: 'Access denied' });
        }

        if (record.pdf_path) {
          deleteCorrespondencePdf(record.pdf_path);
        }

        const pdfPath = saveCorrespondencePdf(uploadSubdir, id, pdfBuffer);
        await pool.query(`UPDATE ${UNIFIED_TABLE} SET pdf_path = ? WHERE id = ?`, [pdfPath, id]);

        const updated = await pool.query(getByIdQuery, [id]);
        res.json({
          success: true,
          correspondence: mapCorrespondenceRow(updated.rows[0]),
        });
      } catch (error) {
        next(error);
      }
    },

    downloadPdf: async (req, res, next) => {
      try {
        const { id } = req.params;
        const existing = await pool.query(
          `SELECT c.*, p.project_id as project_business_id
           FROM ${UNIFIED_TABLE} c
           LEFT JOIN projects p ON c.project_id = p.id
           WHERE c.id = ?`,
          [id]
        );

        if (existing.rows.length === 0) {
          return res.status(404).json({ message: 'Correspondence record not found' });
        }

        const record = existing.rows[0];
        if (!matchesCase(record, caseInOut)) {
          return res.status(404).json({ message: 'Correspondence record not found' });
        }

        if (!record.pdf_path || !fs.existsSync(record.pdf_path)) {
          return res.status(404).json({ message: 'PDF file not found' });
        }

        const fileName = `${record.project_business_id || record.project_id || 'correspondence'}-${record.number}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

        fs.createReadStream(record.pdf_path).pipe(res);
      } catch (error) {
        next(error);
      }
    },
  };
}

const inputController = createCorrespondenceController(
  'in',
  'incoming_correspondence',
  'incoming'
);

const outputController = createCorrespondenceController(
  'out',
  'outgoing_correspondence',
  'outgoing'
);

export const {
  getAll: getAllInputCorrespondence,
  getById: getInputCorrespondenceById,
  getNumbers: getInputCorrespondenceNumbers,
  checkEditPermission: checkInputCorrespondenceEditPermission,
  create: createInputCorrespondence,
  update: updateInputCorrespondence,
  delete: deleteInputCorrespondence,
  uploadPdf: uploadInputCorrespondencePdf,
  downloadPdf: downloadInputCorrespondencePdf,
} = inputController;

export const {
  getAll: getAllOutputCorrespondence,
  getById: getOutputCorrespondenceById,
  getNumbers: getOutputCorrespondenceNumbers,
  checkEditPermission: checkOutputCorrespondenceEditPermission,
  create: createOutputCorrespondence,
  update: updateOutputCorrespondence,
  delete: deleteOutputCorrespondence,
  uploadPdf: uploadOutputCorrespondencePdf,
  downloadPdf: downloadOutputCorrespondencePdf,
} = outputController;
