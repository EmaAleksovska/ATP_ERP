import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import CorrespondenceDataTable from '../../components/Correspondence/CorrespondenceDataTable'
import CorrespondenceFilters, { emptyFilters } from '../../components/Correspondence/CorrespondenceFilters'
import CorrespondenceRecordEditForm from '../../components/Correspondence/CorrespondenceRecordEditForm'
import ConfirmDialog from '../../components/Correspondence/ConfirmDialog'
import { getCorrespondenceService } from '../../services/correspondenceService'
import { getColumns, isFutureEuropeanDate } from '../../components/Correspondence/columnConfig'
import { exportRecordsToCsv } from '../../components/Correspondence/exportCsv'
import useDebouncedValue from '../../hooks/useDebouncedValue'
import '../../pages/admin/ProjectManagement.css'
import '../../components/Correspondence/CorrespondenceForm.css'
import './CorrespondenceModePages.css'

const CorrespondenceReviewPage = ({ side }) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const service = getCorrespondenceService(side)
  const columns = useMemo(
    () => getColumns(side).filter((col) => col.key !== 'caseInOut'),
    [side],
  )

  const [filters, setFilters] = useState(emptyFilters)
  const debouncedFilters = useDebouncedValue(filters, 300)
  const [selected, setSelected] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [editError, setEditError] = useState('')
  const [pdfFile, setPdfFile] = useState(null)
  const [pdfError, setPdfError] = useState('')
  const [permissionDenied, setPermissionDenied] = useState(false)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [`${side}-correspondence-review`, debouncedFilters],
    queryFn: () => service.getAll(debouncedFilters),
    placeholderData: keepPreviousData,
  })

  const records = useMemo(() => data?.correspondence || [], [data])
  const hasActiveFilters = Object.values(debouncedFilters).some(Boolean)

  useEffect(() => {
    setEditForm(null)
    setPdfFile(null)
    setEditError('')
  }, [selected?.id])

  const handleRowClick = (record) => {
    setSelected(record)
  }

  const handleStartEdit = async () => {
    if (!selected || editForm) return
    setEditError('')
    try {
      await service.checkEditPermission(selected.id)
      setEditForm({
        type: selected.type,
        description: selected.description || '',
        date: selected.displayDate || selected.date || '',
        sender: selected.sender || '',
      })
    } catch {
      setPermissionDenied(true)
    }
  }

  const handleCancelEdit = () => {
    setEditForm(null)
    setPdfFile(null)
    setEditError('')
  }

  const handleSave = async () => {
    if (!selected || !editForm) return
    if (!editForm.sender) {
      setEditError(t('correspondence.selectSender'))
      return
    }
    if (isFutureEuropeanDate(editForm.date)) {
      setEditForm((prev) => ({ ...prev, date: '' }))
      setEditError(t('correspondence.futureDateCleared'))
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
      await queryClient.invalidateQueries([`${side}-correspondence-review`])
      setSelected(null)
      setEditForm(null)
      setPdfFile(null)
      setEditError('')
    } catch (err) {
      setEditError(err.response?.data?.message || t('common.error'))
    }
  }

  const pdfFileName = (record) =>
    `${record.projectId || 'correspondence'}-${record.number || 'file'}.pdf`

  const handleViewPdf = async (record) => {
    setPdfError('')
    try {
      await service.viewPdf(record.id)
    } catch (err) {
      setPdfError(err.response?.data?.message || t('correspondence.pdfViewFailed'))
    }
  }

  const handleDownloadPdf = async (record) => {
    setPdfError('')
    try {
      await service.downloadPdf(record.id, pdfFileName(record))
    } catch (err) {
      setPdfError(err.response?.data?.message || t('correspondence.pdfDownloadFailed'))
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    const dataToExport = selected ? [selected] : records
    if (dataToExport.length === 0) return
    const suffix = selected ? 'detail' : 'filtered'
    const filename = `${side}-correspondence-review-${suffix}.csv`
    exportRecordsToCsv(dataToExport, columns, filename)
  }

  const isInitialLoad = isLoading && !data

  return (
    <div className="correspondence-mode-page">
      <div className="page-header no-print">
        <h1>
          {t(side === 'input' ? 'correspondence.inputTitle' : 'correspondence.outputTitle')}
          {' — '}
          {t('correspondence.modeReview')}
        </h1>
      </div>

      {!editForm && (
        <CorrespondenceFilters
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters(emptyFilters)}
        />
      )}

      {records.length > 0 && (
        <div className="correspondence-toolbar no-print">
          <button type="button" className="btn-secondary" onClick={handlePrint}>
            {t('correspondence.print')}
          </button>
          <button type="button" className="btn-secondary" onClick={handleExport}>
            {t('correspondence.exportCsv')}
          </button>
          <button
            type="button"
            className="btn-secondary"
            disabled={!selected || !!editForm}
            onClick={handleStartEdit}
          >
            {t('correspondence.modeEdit')}
          </button>
        </div>
      )}

      {pdfError && <div className="error-message no-print">{pdfError}</div>}

      {editForm && selected && (
        <CorrespondenceRecordEditForm
          side={side}
          record={selected}
          editForm={editForm}
          setEditForm={setEditForm}
          pdfFile={pdfFile}
          setPdfFile={setPdfFile}
          error={editError}
          setError={setEditError}
          onSave={handleSave}
          onCancel={handleCancelEdit}
          onDownloadPdf={(id) => service.downloadPdf(id)}
        />
      )}

      {isInitialLoad ? (
        <p className="correspondence-empty-message no-print">{t('common.loading')}</p>
      ) : records.length === 0 ? (
        <p className="correspondence-empty-message no-print">
          {hasActiveFilters
            ? t('correspondence.noMatchingLetters')
            : t('correspondence.noRecords')}
        </p>
      ) : editForm ? (
        <p className="correspondence-editing-hint no-print">
          {t('correspondence.editingRecordHint')}
        </p>
      ) : (
        <CorrespondenceDataTable
          columns={columns}
          records={records}
          selectedId={selected?.id}
          onRowClick={handleRowClick}
          printableId="correspondence-review-print-area"
          showPdfActions
          onViewPdf={handleViewPdf}
          onDownloadPdf={handleDownloadPdf}
        />
      )}

      {isFetching && !isInitialLoad && !editForm && (
        <p className="correspondence-fetching-hint no-print">{t('common.loading')}</p>
      )}

      {permissionDenied && (
        <ConfirmDialog
          message={t('correspondence.notResponsibleMessage')}
          onConfirm={() => setPermissionDenied(false)}
          onCancel={() => setPermissionDenied(false)}
          confirmLabel={t('correspondence.exit')}
        />
      )}
    </div>
  )
}

export default CorrespondenceReviewPage
