import { useTranslation } from 'react-i18next'
import SenderUserSelect from './SenderUserSelect'
import { FILTER_FIELD_CLASS } from './correspondenceFieldLayout'
import {
  TYPE_OPTIONS,
  getColumns,
  europeanToIso,
  isoToEuropean,
  formatTodayIso,
  isFutureIsoDate,
} from './columnConfig'

const CorrespondenceRecordEditForm = ({
  side,
  record,
  editForm,
  setEditForm,
  pdfFile,
  setPdfFile,
  error,
  setError,
  onSave,
  onCancel,
  onDownloadPdf,
}) => {
  const { t } = useTranslation()
  const columns = getColumns(side)

  const handleDateChange = (isoValue) => {
    if (!isoValue) return
    if (isFutureIsoDate(isoValue)) {
      setError(t('correspondence.futureDateCleared'))
      return
    }
    setError('')
    setEditForm((prev) => ({ ...prev, date: isoToEuropean(isoValue) }))
  }

  const displayRecord = { ...record, ...editForm, atp: 'ATP' }
  const editableKeys = ['type', 'description', 'date']

  return (
    <div className="correspondence-inline-edit no-print">
      {error && <div className="error-message">{error}</div>}

      <div className="correspondence-form-actions">
        <button type="button" className="btn-primary btn-compact" onClick={onSave}>
          {t('common.save')}
        </button>
        <button type="button" className="btn-primary btn-compact" onClick={onCancel}>
          {t('common.cancel')}
        </button>
      </div>

      <div className="correspondence-filters">
        <div className="correspondence-filters-row">
          {columns.map((column) => {
            if (column.key === 'caseInOut') return null

            const fieldClass = FILTER_FIELD_CLASS[column.key] || ''
            const editable = editableKeys.includes(column.key)
            const labelExtra = column.key === 'description' ? ` (${t('form.optional')})` : ''

            if (column.key === 'pdf') {
              return (
                <div className={`filter-field ${fieldClass}`} key={column.key}>
                  <label>{t(column.labelKey)}</label>
                  <div className="filter-project-input">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    />
                    {displayRecord?.hasPdf && (
                      <button
                        type="button"
                        className="btn-secondary btn-compact"
                        onClick={() => onDownloadPdf(record.id)}
                        title={t('correspondence.downloadPdf')}
                      >
                        ↓
                      </button>
                    )}
                  </div>
                </div>
              )
            }

            if (column.key === 'type') {
              return (
                <div className={`filter-field ${fieldClass}`} key={column.key}>
                  <label>{t(column.labelKey)}</label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, type: e.target.value }))}
                  >
                    {TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              )
            }

            if (column.key === 'sender') {
              return (
                <div className={`filter-field ${fieldClass}`} key={column.key}>
                  <label>{t(column.labelKey)}</label>
                  <SenderUserSelect
                    value={editForm.sender}
                    onChange={(senderId) => setEditForm((prev) => ({ ...prev, sender: senderId }))}
                    required
                    compact
                    nameOnly
                  />
                </div>
              )
            }

            if (column.key === 'date') {
              return (
                <div className={`filter-field ${fieldClass}`} key={column.key}>
                  <label>{t(column.labelKey)}</label>
                  <input
                    type="date"
                    value={europeanToIso(editForm.date)}
                    max={formatTodayIso()}
                    onChange={(e) => handleDateChange(e.target.value)}
                  />
                </div>
              )
            }

            const value = column.virtual
              ? 'ATP'
              : column.displayKey
                ? displayRecord?.[column.displayKey]
                : displayRecord?.[column.key]

            return (
              <div className={`filter-field ${fieldClass}`} key={column.key}>
                <label>{t(column.labelKey)}{labelExtra}</label>
                <input
                  type="text"
                  className={editable ? undefined : 'correspondence-readonly'}
                  value={editable ? editForm[column.key] ?? value : value}
                  readOnly={!editable}
                  onChange={editable
                    ? (e) => setEditForm((prev) => ({ ...prev, [column.key]: e.target.value }))
                    : undefined}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default CorrespondenceRecordEditForm
