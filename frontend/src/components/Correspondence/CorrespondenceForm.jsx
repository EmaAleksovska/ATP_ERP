import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import '../Projects/ProjectForm.css'
import './CorrespondenceForm.css'

const emptyForm = (user) => ({
  projectId: '',
  type: '',
  number: '',
  totalNumber: '',
  client: '',
  description: '',
  sender: user?.id || '',
  senderName: [user?.firstName, user?.lastName].filter(Boolean).join(' '),
  date: '',
})

const CorrespondenceForm = ({ correspondence, service, titleKey, queryKey, onClose, onSaved }) => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [formData, setFormData] = useState(emptyForm(user))
  const [savedRecord, setSavedRecord] = useState(null)
  const [pdfFile, setPdfFile] = useState(null)
  const [error, setError] = useState('')
  const [uploadMessage, setUploadMessage] = useState('')
  const queryClient = useQueryClient()

  const activeRecord = savedRecord || correspondence
  const isEditing = Boolean(correspondence?.id)

  useEffect(() => {
    if (correspondence) {
      setFormData({
        projectId: correspondence.projectId || '',
        type: correspondence.type || '',
        number: correspondence.number ?? '',
        totalNumber: correspondence.totalNumber ?? '',
        client: correspondence.client || '',
        description: correspondence.description || '',
        sender: correspondence.sender || '',
        senderName: correspondence.senderName || '',
        date: correspondence.displayDate || correspondence.date || '',
      })
      setSavedRecord(null)
    } else {
      setFormData(emptyForm(user))
      setSavedRecord(null)
    }
    setPdfFile(null)
    setUploadMessage('')
  }, [correspondence])

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (activeRecord?.id) {
        return service.update(activeRecord.id, data)
      }
      return service.create(data)
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries([queryKey])
      const record = result.correspondence
      setSavedRecord(record)
      onSaved?.(record)
      setError('')
    },
    onError: (err) => {
      setError(err.response?.data?.message || t('common.error'))
    },
  })

  const uploadMutation = useMutation({
    mutationFn: ({ id, file }) => service.uploadPdf(id, file),
    onSuccess: (result) => {
      queryClient.invalidateQueries([queryKey])
      setSavedRecord(result.correspondence)
      setPdfFile(null)
      setUploadMessage(t('correspondence.pdfUploaded'))
      setError('')
    },
    onError: (err) => {
      setError(err.response?.data?.message || t('correspondence.pdfUploadFailed'))
    },
  })

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setUploadMessage('')

    const payload = {
      ...formData,
      number: formData.number === '' ? undefined : Number(formData.number),
      totalNumber: formData.totalNumber === '' ? null : Number(formData.totalNumber),
    }
    delete payload.senderName

    if (isEditing) {
      delete payload.number
      delete payload.sender
    }

    saveMutation.mutate(payload)
  }

  const handleUploadPdf = () => {
    if (!activeRecord?.id) {
      setError(t('correspondence.saveBeforeUpload'))
      return
    }
    if (!pdfFile) {
      setError(t('correspondence.selectPdf'))
      return
    }

    setError('')
    setUploadMessage('')
    uploadMutation.mutate({ id: activeRecord.id, file: pdfFile })
  }

  const handleDownloadPdf = async () => {
    if (!activeRecord?.id) return
    try {
      const fileName = `${activeRecord.projectId || 'correspondence'}-${activeRecord.number || 'file'}.pdf`
      await service.downloadPdf(activeRecord.id, fileName)
    } catch (err) {
      setError(err.response?.data?.message || t('correspondence.pdfDownloadFailed'))
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content correspondence-modal">
        <div className="modal-header">
          <h2>{t(titleKey)}</h2>
          <button onClick={onClose} className="btn-close">×</button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {uploadMessage && <div className="success-message">{uploadMessage}</div>}

        <form onSubmit={handleSubmit}>
          <div className="correspondence-form-grid">
            <div className="form-group">
              <label>{t('correspondence.projectId')}</label>
              <input
                type="text"
                value={formData.projectId}
                onChange={(e) => handleChange('projectId', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>{t('correspondence.type')}</label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                required
              >
                <option value="">{t('correspondence.selectType')}</option>
                <option value="E">E</option>
                <option value="L">L</option>
                <option value="O">O</option>
                <option value="G">G</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t('correspondence.number')}</label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.number}
                onChange={(e) => handleChange('number', e.target.value)}
                required={!isEditing}
                readOnly={isEditing}
              />
            </div>

            <div className="form-group">
              <label>{t('correspondence.totalNumber')}</label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.totalNumber}
                onChange={(e) => handleChange('totalNumber', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>{t('correspondence.client')}</label>
              <input
                type="text"
                value={formData.client}
                onChange={(e) => handleChange('client', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>{t('correspondence.date')}</label>
              <input
                type="text"
                placeholder={t('correspondence.datePlaceholder')}
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                required
              />
            </div>

            <div className="form-group form-group-full">
              <label>{t('correspondence.description')}</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>{t('correspondence.sender')}</label>
              <input
                type="text"
                value={formData.senderName}
                readOnly
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </form>

        {activeRecord?.id && (
          <div className="pdf-section">
            <h3>{t('correspondence.pdfSection')}</h3>
            <p className="pdf-hint">{t('correspondence.pdfHint')}</p>

            {activeRecord.hasPdf && (
              <button type="button" className="btn-secondary" onClick={handleDownloadPdf}>
                {t('correspondence.downloadPdf')}
              </button>
            )}

            <div className="pdf-upload-row">
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={handleUploadPdf}
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? t('common.loading') : t('correspondence.uploadPdf')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CorrespondenceForm
