import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectService } from '../../services/projectService'
import { userService } from '../../services/userService'
import ProjectForm from '../../components/Projects/ProjectForm'
import './ProjectManagement.css'

const ProjectManagement = () => {
  const { t } = useTranslation()
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const queryClient = useQueryClient()

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getAllProjects(),
  })

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAllUsers(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => projectService.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['projects'])
    },
  })

  const handleEdit = (project) => {
    setEditingProject(project)
    setShowForm(true)
  }

  const handleCreate = () => {
    setEditingProject(null)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm(t('projectManagement.confirmDelete'))) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch (err) {
        alert(err.response?.data?.message || t('projectManagement.cannotDeleteProject'))
      }
    }
  }

  if (projectsLoading) return <div>{t('common.loading')}</div>

  return (
    <div className="project-management">
      <div className="page-header">
        <h1>{t('projectManagement.title')}</h1>
        <button onClick={handleCreate} className="btn-primary">
          {t('projectManagement.createProject')}
        </button>
      </div>

      {showForm && (
        <ProjectForm
          project={editingProject}
          users={users?.users || []}
          onClose={() => {
            setShowForm(false)
            setEditingProject(null)
          }}
        />
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('projectManagement.projectId')}</th>
              <th>{t('projectManagement.projectName')}</th>
              <th>{t('projectManagement.description')}</th>
              <th>{t('projectManagement.clientCode')}</th>
              <th>{t('projectManagement.responsibleUser')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {projects?.projects?.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>{t('projectManagement.noProjects')}</td>
              </tr>
            ) : (
              projects?.projects?.map((project) => (
                <tr key={project.id}>
                  <td>{project.project_id}</td>
                  <td>{project.name}</td>
                  <td>{project.description || '-'}</td>
                  <td>{project.client_code || '-'}</td>
                  <td>
                    {project.responsible_first_name && project.responsible_last_name
                      ? `${project.responsible_first_name} ${project.responsible_last_name}`
                      : '-'}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => handleEdit(project)} 
                        className="btn-edit"
                        disabled={!project.id}
                      >
                        {t('common.edit')}
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="btn-delete"
                        disabled={!project.id}
                      >
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

export default ProjectManagement

