import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import CorrespondenceDataTable from '../../components/Correspondence/CorrespondenceDataTable'
import CorrespondenceFilters, { emptyFilters } from '../../components/Correspondence/CorrespondenceFilters'
import ConfirmDialog from '../../components/Correspondence/ConfirmDialog'
import SenderUserSelect from '../../components/Correspondence/SenderUserSelect'
import { getCorrespondenceService } from '../../services/correspondenceService'
import {
  TYPE_OPTIONS,
  getColumns,
  europeanToIso,
  isoToEuropean,
  formatTodayIso,
  isFutureEuropeanDate,
  isFutureIsoDate,
} from '../../components/Correspondence/columnConfig'
import useDebouncedValue from '../../hooks/useDebouncedValue'
import '../../pages/admin/ProjectManagement.css'
import '../../components/Correspondence/CorrespondenceForm.css'
import './CorrespondenceModePages.css'

const reviewPath = (side) => `/correspondence/${side}/review`

const CorrespondenceEditPage = ({ side }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const service = getCorrespondenceService(side)
  const columns = getColumns(side)

  const [filters, setFilters] = useState(emptyFilters)
  const debouncedFilters = useDebouncedValue(filters, 300)
  const [selected, setSelected] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [error, setError] = useState('')
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [pdfFile, setPdfFile] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: [`${side}-correspondence-edit`, debouncedFilters],
    queryFn: () => service.getAll(debouncedFilters),
  })

  const records = useMemo(() => data?.correspondence || [], [data])
  const hasActiveFilters = Object.values(debouncedFilters).some(Boolean)

  const handleRowClick = async (record) => {
    setError('')
    try {
      await service.checkEditPermission(record.id)
      setSelected(record)
      setEditForm({
        type: record.type,
        description: record.description || '',
        date: record.displayDate || record.date || '',
        sender: record.sender || '',
      })
    } catch (err) {
      setPermissionDenied(true)
      setError(err.response?.data?.message || t('correspondence.notResponsible'))
    }
  }

  const handleCancelEdit = () => {
    setSelected(null)
    setEditForm(null)
    setPdfFile(null)
    setError('')
  }

  const handleDateChange = (isoValue) => {
    if (!isoValue) return
    if (isFutureIsoDate(isoValue)) {
      setError(t('correspondence.futureDateCleared'))
      return
    }
    setError('')
    setEditForm((prev) => ({ ...prev, date: isoToEuropean(isoValue) }))
  }

  const handleSave = async () => {
    if (!selected || !editForm) return
    if (!editForm.sender) {
      setError(t('correspondence.selectSender'))
      return
    }
    if (isFutureEuropeanDate(editForm.date)) {
      setEditForm((prev) => ({ ...prev, date: '' }))
      setError(t('correspondence.futureDateCleared'))
      return
    }
    try {
      const payload = {
        type: editForm.type,
        description: editForm.description,
        date: editForm.date,
        sender: editForm.sender,
      }
      if (pdfFile) {
        const reader = new FileReader()
        const pdf = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(pdfFile)
        })
        payload.pdf = pdf
      }
      await service.update(selected.id, payload)
      queryClient.invalidateQueries([`${side}-correspondence-edit`])
      navigate(reviewPath(side))
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'))
    }
  }

  const displayRecord = selected
    ? { ...selected, ...editForm, atp: 'ATP' }
    : null

  if (isLoading) return <div className="correspondence-mode-page">{t('common.loading')}</div>

  if (permissionDenied) {
    return (
      <ConfirmDialog
        message={t('correspondence.notResponsible')}
        onConfirm={() => {
          setPermissionDenied(false)
          navigate(reviewPath(side))
        }}
        onCancel={() => setPermissionDenied(false)}
        confirmLabel={t('common.back')}
      />
    )
  }

  return (
    <div className="correspondence-mode-page">
      <div className="page-header">
        <h1>
          {t(side === 'input' ? 'correspondence.inputTitle' : 'correspondence.outputTitle')}
          {' — '}
          {t('correspondence.modeEdit')}
        </h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      {!editForm ? (
        <>
          <CorrespondenceFilters
            filters={filters}
            onChange={setFilters}
            onClear={() => setFilters(emptyFilters)}
          />
          {records.length === 0 ? (
            <p className="correspondence-empty-message">
              {hasActiveFilters
                ? t('correspondence.noMatchingLetters')
                : t('correspondence.noRecords')}
            </p>
          ) : (
            <CorrespondenceDataTable
              columns={columns}
              records={records}
              onRowClick={handleRowClick}
            />
          )}
        </>
      ) : (
        <>
          <div className="correspondence-toolbar">
            <button type="button" className="btn-primary" onClick={handleSave}>
              {t('common.save')}
            </button>
            <button type="button" className="btn-secondary" onClick={handleCancelEdit}>
              {t('common.cancel')}
            </button>
          </div>
          <div className="correspondence-form-grid">
            {columns.map((column) => {
              const editable = ['type', 'description', 'date'].includes(column.key)
              if (column.key === 'pdf') {
                return (
                  <div className="form-group form-group-full" key={column.key}>
                    <label>{t(column.labelKey)}</label>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    />
                    {displayRecord?.hasPdf && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => service.downloadPdf(selected.id)}
                      >
                        {t('correspondence.downloadPdf')}
                      </button>
                    )}
                  </div>
                )
              }

              if (column.key === 'type') {
                return (
                  <div className="form-group" key={column.key}>
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
                  <div className="form-group" key={column.key}>
                    <label>{t(column.labelKey)}</label>
                    <SenderUserSelect
                      value={editForm.sender}
                      onChange={(senderId) => setEditForm((prev) => ({ ...prev, sender: senderId }))}
                      required
                    />
                  </div>
                )
              }

              if (column.key === 'date') {
                return (
                  <div className="form-group" key={column.key}>
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
                  : column.key === 'sender'
                    ? displayRecord?.senderName
                    : displayRecord?.[column.key]

              return (
                <div className="form-group" key={column.key}>
                  <label>{t(column.labelKey)}</label>
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
        </>
      )}
    </div>
  )
}

export default CorrespondenceEditPage
