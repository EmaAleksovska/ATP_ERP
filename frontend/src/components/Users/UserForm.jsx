import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '../../services/userService'
import './UserForm.css'

const UserForm = ({ user, onClose }) => {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'user',
    status: 'active',
  })
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        password: '',
        role: user.role || 'user',
        status: user.status || 'active',
      })
    }
  }, [user])

  const mutation = useMutation({
    mutationFn: (data) => {
      if (user) {
        return userService.updateUser(user.id, data)
      } else {
        return userService.createUser(data)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      onClose()
    },
    onError: (err) => {
      setError(err.response?.data?.message || t('common.error'))
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    const submitData = { ...formData }
    if (user && !submitData.password) {
      delete submitData.password
    }

    mutation.mutate(submitData)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{user ? t('userManagement.editUser') : t('userManagement.createUser')}</h2>
          <button onClick={onClose} className="btn-close">×</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('common.firstName')}</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>{t('common.lastName')}</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>{t('common.email')}</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>{t('common.password')} {user && `(${t('form.passwordLeaveBlank')})`}</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!user}
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label>{t('common.role')}</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
            >
              <option value="user">{t('form.user')}</option>
              <option value="admin">{t('form.admin')}</option>
            </select>
          </div>

          <div className="form-group">
            <label>{t('common.status')}</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              required
            >
              <option value="active">{t('common.active')}</option>
              <option value="inactive">{t('common.inactive')}</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-submit" disabled={mutation.isLoading}>
              {mutation.isLoading ? t('form.saving') : user ? t('form.update') : t('form.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserForm

