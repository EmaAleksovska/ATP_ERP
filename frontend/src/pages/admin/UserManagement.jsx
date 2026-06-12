import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '../../services/userService'
import UserForm from '../../components/Users/UserForm'
import './UserManagement.css'

const UserManagement = () => {
  const { t } = useTranslation()
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAllUsers(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => userService.updateUserStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
    },
  })

  const handleEdit = (user) => {
    setEditingUser(user)
    setShowForm(true)
  }

  const handleCreate = () => {
    setEditingUser(null)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm(t('userManagement.confirmDelete'))) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handleStatusToggle = async (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    await statusMutation.mutateAsync({ id: user.id, status: newStatus })
  }

  if (isLoading) return <div>{t('common.loading')}</div>

  return (
    <div className="user-management">
      <div className="page-header">
        <h1>{t('userManagement.title')}</h1>
        <button onClick={handleCreate} className="btn-primary">
          {t('userManagement.createUser')}
        </button>
      </div>

      {showForm && (
        <UserForm
          user={editingUser}
          onClose={() => {
            setShowForm(false)
            setEditingUser(null)
          }}
        />
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('userManagement.name')}</th>
              <th>{t('userManagement.email')}</th>
              <th>{t('userManagement.role')}</th>
              <th>{t('userManagement.status')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {data?.users?.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center' }}>{t('userManagement.noUsers')}</td>
              </tr>
            ) : (
              data?.users?.map((user) => (
                <tr key={user.id}>
                  <td>{user.first_name} {user.last_name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className="role-badge">{user.role}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.status}`}>{t(`common.${user.status}`)}</span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => handleEdit(user)} className="btn-edit">{t('common.edit')}</button>
                      <button
                        onClick={() => handleStatusToggle(user)}
                        className="btn-status"
                      >
                        {user.status === 'active' ? t('userManagement.deactivate') : t('userManagement.activate')}
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="btn-delete"
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

export default UserManagement

