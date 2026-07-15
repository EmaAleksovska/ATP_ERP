export const TYPE_OPTIONS = ['E', 'L', 'O', 'G'];

export const OUTPUT_COLUMNS = [
  { key: 'projectId', labelKey: 'correspondence.projectId' },
  { key: 'type', labelKey: 'correspondence.type' },
  { key: 'atp', labelKey: 'correspondence.atp', virtual: true },
  { key: 'client', labelKey: 'correspondence.client' },
  { key: 'sender', labelKey: 'correspondence.sender', displayKey: 'senderName' },
  { key: 'number', labelKey: 'correspondence.number' },
  { key: 'totalNumber', labelKey: 'correspondence.totalNumber' },
  { key: 'date', labelKey: 'correspondence.date', displayKey: 'displayDate' },
  { key: 'description', labelKey: 'correspondence.description' },
  { key: 'pdf', labelKey: 'correspondence.pdf', isPdf: true },
  { key: 'caseInOut', labelKey: 'correspondence.caseInOut' },
];

export const INPUT_COLUMNS = [
  { key: 'projectId', labelKey: 'correspondence.projectId' },
  { key: 'type', labelKey: 'correspondence.type' },
  { key: 'client', labelKey: 'correspondence.client' },
  { key: 'atp', labelKey: 'correspondence.atp', virtual: true },
  { key: 'sender', labelKey: 'correspondence.sender', displayKey: 'senderName' },
  { key: 'number', labelKey: 'correspondence.number' },
  { key: 'totalNumber', labelKey: 'correspondence.totalNumber' },
  { key: 'date', labelKey: 'correspondence.date', displayKey: 'displayDate' },
  { key: 'description', labelKey: 'correspondence.description' },
  { key: 'pdf', labelKey: 'correspondence.pdf', isPdf: true },
  { key: 'caseInOut', labelKey: 'correspondence.caseInOut' },
];

export function getColumns(side) {
  return side === 'input' ? INPUT_COLUMNS : OUTPUT_COLUMNS;
}

export function getCellValue(record, column) {
  if (column.virtual && column.key === 'atp') return 'ATP';
  if (column.isPdf) return record.hasPdf ? 'PDF' : '';
  const field = column.displayKey || column.key;
  return record[field] ?? '';
}

export function formatTodayEuropean() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  return `${d}.${m}.${y}`;
}

export function formatTodayIso() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  return `${y}-${m}-${d}`;
}

export function europeanToIso(value) {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(value || '').trim());
  if (!match) return '';
  return `${match[3]}-${match[2]}-${match[1]}`;
}

export function isoToEuropean(iso) {
  if (!iso) return '';
  const [year, month, day] = iso.split('-');
  if (!year || !month || !day) return '';
  return `${day}.${month}.${year}`;
}

export function isFutureEuropeanDate(value) {
  if (!value) return false;
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value.trim());
  if (!match) return false;
  const input = new Date(`${match[3]}-${match[2]}-${match[1]}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return input > today;
}

export function isFutureIsoDate(iso) {
  if (!iso) return false;
  const input = new Date(`${iso}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return input > today;
}
