import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { projectService } from '../../services/projectService'
import './ProjectForm.css'

const ProjectForm = ({ project, users, onClose }) => {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    projectId: '',
    responsibleUserId: '',
  })
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        projectId: project.project_id || '',
        responsibleUserId: project.responsible_user_id || '',
      })
    }
  }, [project])

  const mutation = useMutation({
    mutationFn: (data) => {
      if (project && project.id) {
        return projectService.updateProject(project.id, data)
      } else {
        return projectService.createProject(data)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['projects'])
      onClose()
    },
    onError: (err) => {
      setError(err.response?.data?.message || t('common.error'))
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    // Prevent editing projects with null IDs
    if (project && !project.id) {
      setError(t('form.cannotEditProject'))
      return
    }

    const submitData = {
      ...formData,
      // Send null if empty string, otherwise send the value
      responsibleUserId: formData.responsibleUserId === '' ? null : formData.responsibleUserId,
    }

    mutation.mutate(submitData)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{project ? t('projectManagement.editProject') : t('projectManagement.createProject')}</h2>
          <button onClick={onClose} className="btn-close">×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('projectManagement.projectName')}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>{t('projectManagement.projectId')}</label>
            <input
              type="text"
              value={formData.projectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>{t('projectManagement.description')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>{t('projectManagement.responsibleUser')}</label>
            <select
              value={formData.responsibleUserId}
              onChange={(e) => setFormData({ ...formData, responsibleUserId: e.target.value })}
            >
              <option value="">{t('form.selectUser')}</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-submit" disabled={mutation.isLoading}>
              {mutation.isLoading ? t('form.saving') : project ? t('form.update') : t('form.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProjectForm

