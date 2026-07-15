export const DRAFT_PROJECT_ID = '__DRAFT__';
export const DRAFT_CLIENT = '__DRAFT__';
export const DRAFT_TYPE = ' ';

export function isDraftRow(row) {
  if (!row) return false;
  return row.project_id === DRAFT_PROJECT_ID || row.client === DRAFT_CLIENT;
}

export function todayIsoDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function decodePdfPayload(body) {
  if (!body?.pdf || typeof body.pdf !== 'string') {
    throw new Error('PDF data is required');
  }

  const base64 = body.pdf.includes(',') ? body.pdf.split(',')[1] : body.pdf;
  const buffer = Buffer.from(base64, 'base64');

  if (buffer.length === 0) {
    throw new Error('Invalid PDF data');
  }

  if (buffer.length > 20 * 1024 * 1024) {
    throw new Error('PDF file must be 20 MB or smaller');
  }

  const header = buffer.subarray(0, 4).toString('utf8');
  if (header !== '%PDF') {
    throw new Error('Only PDF files are allowed');
  }

  return buffer;
}

export function parseEuropeanDate(input) {
  if (!input || typeof input !== 'string') {
    throw new Error('Date is required');
  }

  const trimmed = input.trim();
  const european = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(trimmed);
  if (!european) {
    throw new Error('Invalid date format. Use DD.MM.YYYY');
  }

  return `${european[3]}-${european[2]}-${european[1]}`;
}

export function formatDateForDisplay(isoDate) {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return isoDate;
  return `${day}.${month}.${year}`;
}

export function validateCorrespondencePayload(body, { isUpdate = false, isFinalize = false } = {}) {
  const errors = [];
  const data = {};

  const requiredFields = isFinalize
    ? ['projectId', 'type', 'client', 'number', 'date']
    : isUpdate
      ? []
      : ['projectId', 'type', 'client', 'number', 'date'];

  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      errors.push(`${field} is required`);
    }
  }

  if (body.projectId !== undefined) {
    const value = String(body.projectId).trim();
    if (!value || value === DRAFT_PROJECT_ID) errors.push('projectId is required');
    else data.project_id = value;
  }

  if (body.type !== undefined) {
    const value = String(body.type).trim();
    if (!value) errors.push('type is required');
    else if (value.length !== 1) errors.push('type must be exactly 1 character');
    else if (value === DRAFT_TYPE) errors.push('type is required');
    else data.type = value;
  }

  if (body.number !== undefined) {
    const value = Number(body.number);
    if (!Number.isInteger(value) || value < 0) {
      errors.push('number must be a non-negative integer');
    } else {
      data.number = value;
    }
  }

  if (body.totalNumber !== undefined) {
    if (body.totalNumber === '' || body.totalNumber === null) {
      data.total_number = null;
    } else {
      const value = Number(body.totalNumber);
      if (!Number.isInteger(value) || value < 0) {
        errors.push('totalNumber must be a non-negative integer');
      } else {
        data.total_number = value;
      }
    }
  }

  if (body.client !== undefined) {
    const value = String(body.client).trim();
    if (!value || value === DRAFT_CLIENT) errors.push('client is required');
    else data.client = value;
  }

  if (body.description !== undefined) {
    data.description = body.description === '' ? null : String(body.description).trim();
  }

  if (body.sender !== undefined) {
    data.sender = body.sender === '' ? null : String(body.sender).trim();
  }

  if (body.date !== undefined) {
    try {
      data.correspondence_date = parseEuropeanDate(String(body.date));
    } catch (error) {
      errors.push(error.message);
    }
  }

  return { errors, data };
}

export function formatUserFullName(firstName, lastName) {
  return [firstName, lastName].filter(Boolean).join(' ');
}

export function mapCorrespondenceRow(row) {
  if (!row) return null;

  return {
    id: row.id,
    projectId: row.project_business_id || row.project_id,
    projectRefId: row.project_id,
    type: row.type,
    number: row.number,
    totalNumber: row.total_number,
    client: row.client,
    description: row.description,
    sender: row.sender,
    senderName: formatUserFullName(row.sender_first_name, row.sender_last_name),
    date: row.correspondence_date,
    displayDate: formatDateForDisplay(row.correspondence_date),
    pdfPath: row.pdf_path,
    hasPdf: Boolean(row.pdf_path),
    caseInOut: row.case_in_out,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
