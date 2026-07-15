import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ProjectPickerModal from '../../components/Correspondence/ProjectPickerModal'
import SenderUserSelect from '../../components/Correspondence/SenderUserSelect'
import { getCorrespondenceService } from '../../services/correspondenceService'
import {
  TYPE_OPTIONS,
  getColumns,
  formatTodayEuropean,
  formatTodayIso,
  europeanToIso,
  isoToEuropean,
  isFutureEuropeanDate,
  isFutureIsoDate,
} from '../../components/Correspondence/columnConfig'
import { FILTER_FIELD_CLASS } from '../../components/Correspondence/correspondenceFieldLayout'
import '../../pages/admin/ProjectManagement.css'
import '../../components/Correspondence/CorrespondenceForm.css'
import './CorrespondenceModePages.css'

const reviewPath = (side) => `/correspondence/${side}/review`

const CorrespondenceNewPage = ({ side }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const service = getCorrespondenceService(side)
  const columns = getColumns(side)

  const [showPicker, setShowPicker] = useState(true)
  const [error, setError] = useState('')
  const [pdfFile, setPdfFile] = useState(null)

  const [form, setForm] = useState({
    projectRefId: '',
    projectId: '',
    type: '',
    client: '',
    sender: '',
    senderName: '',
    number: '1',
    totalNumber: '1',
    date: formatTodayEuropean(),
    description: '',
    atp: 'ATP',
  })

  const loadNumbers = async (projectRefId) => {
    const numbers = await service.getNumbers(projectRefId)
    setForm((prev) => ({
      ...prev,
      number: String(numbers.number),
      totalNumber: String(numbers.totalNumber),
    }))
  }

  const handleProjectSelect = async ({ projectRefId, projectId, clientCode, senderId, senderName }) => {
    setShowPicker(false)
    setForm((prev) => ({
      ...prev,
      projectRefId,
      projectId,
      client: clientCode,
      sender: senderId || '',
      senderName: senderName || '',
    }))
    setError('')
    try {
      await loadNumbers(projectRefId)
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'))
    }
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleDateChange = (isoValue) => {
    if (!isoValue) return
    if (isFutureIsoDate(isoValue)) {
      setError(t('correspondence.futureDateCleared'))
      return
    }
    setError('')
    setForm((prev) => ({ ...prev, date: isoToEuropean(isoValue) }))
  }

  const readPdfAsBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to read PDF'))
    reader.readAsDataURL(file)
  })

  const handleSave = async () => {
    setError('')
    if (!form.sender) {
      setError(t('correspondence.selectSender'))
      return
    }
    if (isFutureEuropeanDate(form.date)) {
      setError(t('correspondence.futureDateCleared'))
      return
    }
    try {
      const payload = {
        projectId: form.projectRefId,
        type: form.type,
        client: form.client,
        sender: form.sender,
        number: Number(form.number),
        totalNumber: Number(form.totalNumber),
        date: form.date,
        description: form.description || '',
      }
      if (pdfFile) {
        payload.pdf = await readPdfAsBase64(pdfFile)
      }
      await service.create(payload)
      navigate(reviewPath(side))
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'))
    }
  }

  const handleCancel = () => {
    navigate(reviewPath(side))
  }

  const readOnlyKeys = ['projectId', 'client', 'atp', 'number', 'totalNumber']
  const editableKeys = ['type', 'description', 'date']

  return (
    <div className="correspondence-mode-page">
      <div className="page-header">
        <h1>
          {t(side === 'input' ? 'correspondence.inputTitle' : 'correspondence.outputTitle')}
          {' — '}
          {t('correspondence.modeNew')}
        </h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="correspondence-form-actions">
        <button type="button" className="btn-primary btn-compact" onClick={handleSave}>
          {t('common.save')}
        </button>
        <button type="button" className="btn-primary btn-compact" onClick={handleCancel}>
          {t('common.cancel')}
        </button>
      </div>

      <div className="correspondence-filters">
        <div className="correspondence-filters-row">
          {columns.map((column) => {
            if (column.key === 'caseInOut') return null

            const fieldClass = FILTER_FIELD_CLASS[column.key] || ''
            const labelExtra = column.key === 'description' ? ` (${t('form.optional')})` : ''

            if (column.key === 'projectId') {
              return (
                <div className={`filter-field ${fieldClass}`} key={column.key}>
                  <label>{t(column.labelKey)}</label>
                  <div className="filter-project-input">
                    <input
                      type="text"
                      className="correspondence-readonly"
                      value={form.projectId}
                      readOnly
                    />
                    <button
                      type="button"
                      className="btn-secondary btn-compact"
                      onClick={() => setShowPicker(true)}
                      title={t('correspondence.selectProject')}
                    >
                      …
                    </button>
                  </div>
                </div>
              )
            }

            if (column.key === 'pdf') {
              return (
                <div className={`filter-field ${fieldClass}`} key={column.key}>
                  <label>{t(column.labelKey)}</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  />
                </div>
              )
            }

            if (column.key === 'type') {
              return (
                <div className={`filter-field ${fieldClass}`} key={column.key}>
                  <label>{t(column.labelKey)}</label>
                  <select
                    value={form.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    required
                  >
                    <option value="">{t('correspondence.selectType')}</option>
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
                    value={form.sender}
                    onChange={(senderId) => setForm((prev) => ({ ...prev, sender: senderId }))}
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
                    value={europeanToIso(form.date)}
                    max={formatTodayIso()}
                    onChange={(e) => handleDateChange(e.target.value)}
                    required
                  />
                </div>
              )
            }

            const key = column.key
            const isReadOnly = readOnlyKeys.includes(key)
            const isEditable = editableKeys.includes(key)
            const formKey = key === 'atp' ? 'atp' : key
            const value = column.virtual ? 'ATP' : form[formKey] ?? ''

            return (
              <div className={`filter-field ${fieldClass}`} key={key}>
                <label>{t(column.labelKey)}{labelExtra}</label>
                <input
                  type="text"
                  className={isReadOnly ? 'correspondence-readonly' : undefined}
                  value={value}
                  readOnly={isReadOnly}
                  onChange={isEditable
                    ? (e) => handleChange(formKey, e.target.value)
                    : undefined}
                />
              </div>
            )
          })}
        </div>
      </div>

      {showPicker && (
        <ProjectPickerModal
          onSelect={handleProjectSelect}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}

export default CorrespondenceNewPage
