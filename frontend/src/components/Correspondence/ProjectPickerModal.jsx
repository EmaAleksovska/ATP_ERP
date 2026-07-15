import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { projectService } from '../../services/projectService'
import '../Projects/ProjectForm.css'

const ProjectPickerModal = ({ onSelect, onClose }) => {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getAllProjects(),
  })

  const projects = data?.projects || []

  return (
    <div className="modal-overlay">
      <div className="modal-content correspondence-modal">
        <div className="modal-header">
          <h2>{t('correspondence.selectProject')}</h2>
          <button type="button" onClick={onClose} className="btn-close">×</button>
        </div>
        {isLoading ? (
          <p>{t('common.loading')}</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('correspondence.projectId')}</th>
                <th>{t('projectManagement.clientCode')}</th>
                <th>{t('projectManagement.projectName')}</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className="correspondence-picker-row"
                  onClick={() => onSelect({
                    projectRefId: project.id,
                    projectId: project.project_id || project.projectId,
                    clientCode: project.client_code || project.clientCode || '',
                    senderId: project.responsible_user_id || '',
                    senderName: [project.responsible_first_name, project.responsible_last_name]
                      .filter(Boolean)
                      .join(' '),
                  })}
                >
                  <td>{project.project_id || project.projectId}</td>
                  <td>{project.client_code || project.clientCode}</td>
                  <td>{project.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default ProjectPickerModal
