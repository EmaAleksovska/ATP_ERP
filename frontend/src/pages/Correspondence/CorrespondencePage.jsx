import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import CorrespondenceForm from '../../components/Correspondence/CorrespondenceForm'
import '../../pages/admin/ProjectManagement.css'
import './CorrespondencePage.css'

const CorrespondencePage = ({
  titleKey,
  createTitleKey,
  service,
  queryKey,
}) => {
  const { t } = useTranslation()
  const [showForm, setShowForm] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: [queryKey],
    queryFn: () => service.getAll(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => service.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries([queryKey])
    },
  })

  const handleCreate = () => {
    setEditingRecord(null)
    setShowForm(true)
  }

  const handleEdit = (record) => {
    setEditingRecord(record)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm(t('correspondence.confirmDelete'))) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch (err) {
        alert(err.response?.data?.message || t('common.error'))
      }
    }
  }

  const handleDownload = async (record) => {
    try {
      const fileName = `${record.projectId || 'correspondence'}-${record.number || 'file'}.pdf`
      await service.downloadPdf(record.id, fileName)
    } catch (err) {
      alert(err.response?.data?.message || t('correspondence.pdfDownloadFailed'))
    }
  }

  if (isLoading) return <div>{t('common.loading')}</div>

  const records = data?.correspondence || []

  return (
    <div className="project-management correspondence-page">
      <div className="page-header">
        <h1>{t(titleKey)}</h1>
        <button onClick={handleCreate} className="btn-primary">
          {t('correspondence.createRecord')}
        </button>
      </div>

      {showForm && (
        <CorrespondenceForm
          correspondence={editingRecord}
          service={service}
          queryKey={queryKey}
          titleKey={editingRecord ? 'correspondence.editRecord' : createTitleKey}
          onClose={() => {
            setShowForm(false)
            setEditingRecord(null)
          }}
          onSaved={() => queryClient.invalidateQueries([queryKey])}
        />
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('correspondence.projectId')}</th>
              <th>{t('correspondence.type')}</th>
              <th>{t('correspondence.number')}</th>
              <th>{t('correspondence.totalNumber')}</th>
              <th>{t('correspondence.client')}</th>
              <th>{t('correspondence.date')}</th>
              <th>{t('correspondence.description')}</th>
              <th>{t('correspondence.sender')}</th>
              <th>{t('correspondence.pdf')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center' }}>
                  {t('correspondence.noRecords')}
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id}>
                  <td>{record.projectId}</td>
                  <td>{record.type}</td>
                  <td>{record.number}</td>
                  <td>{record.totalNumber ?? '-'}</td>
                  <td>{record.client}</td>
                  <td>{record.displayDate || record.date}</td>
                  <td>{record.description || '-'}</td>
                  <td>{record.senderName || '-'}</td>
                  <td>
                    {record.hasPdf ? (
                      <button className="btn-edit" onClick={() => handleDownload(record)}>
                        {t('correspondence.downloadPdf')}
                      </button>
                    ) : (
                      <span className="pdf-missing">{t('correspondence.noPdf')}</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => handleEdit(record)} className="btn-edit">
                        {t('common.edit')}
                      </button>
                      <button onClick={() => handleDelete(record.id)} className="btn-delete">
                        {t('common.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CorrespondencePage
