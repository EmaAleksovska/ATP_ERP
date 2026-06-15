import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectService } from '../../services/projectService'
import { travelRequestService } from '../../services/travelRequestService'
import './TravelRequest.css'

const SubmitTravelRequest = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    projectId: '',
    locationCity: '',
    startDate: '',
    endDate: '',
    dailyAllowance: '',
    notes: '',
  })
  const [error, setError] = useState('')

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getAllProjects(),
  })

  const { data: citiesData } = useQuery({
    queryKey: ['approvedCities'],
    queryFn: () => travelRequestService.getApprovedCities(),
  })

  const mutation = useMutation({
    mutationFn: (data) => travelRequestService.submitRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['myRequests'])
      navigate('/business-trips/travel-requests/my-requests')
    },
    onError: (err) => {
      setError(err.response?.data?.message || t('travelRequest.errorOccurred'))
    },
  })

  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value
    setFormData((prev) => {
      // If end date is before the new start date, reset it
      const updated = { ...prev, startDate: newStartDate }
      if (prev.endDate && newStartDate && prev.endDate < newStartDate) {
        updated.endDate = newStartDate
      }
      return updated
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError(t('travelRequest.endDateAfterStartDate'))
      return
    }

    mutation.mutate({
      projectId: formData.projectId,
      locationCity: formData.locationCity,
      startDate: formData.startDate,
      endDate: formData.endDate,
      dailyAllowance: parseFloat(formData.dailyAllowance),
      notes: formData.notes || null,
    })
  }

  return (
    <div className="travel-request-form">
      <h1>{t('travelRequest.submitRequest')}</h1>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-group">
          <label>{t('common.project')} *</label>
          <select
            value={formData.projectId}
            onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
            required
          >
            <option value="">{t('travelRequest.selectProject')}</option>
            {projects?.projects?.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} ({project.project_id})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>{t('common.city')} *</label>
          <input
            type="text"
            list="cities-list"
            value={formData.locationCity}
            onChange={(e) => setFormData({ ...formData, locationCity: e.target.value })}
            placeholder={t('travelRequest.selectCity')}
            required
          />
          <datalist id="cities-list">
            {citiesData?.cities?.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>{t('common.startDate')} *</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={handleStartDateChange}
              required
            />
          </div>

          <div className="form-group">
            <label>{t('common.endDate')} *</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              min={formData.startDate || ''}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>{t('common.dailyAllowance')} (€) *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.dailyAllowance}
            onChange={(e) => setFormData({ ...formData, dailyAllowance: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>{t('common.additionalNotes')}</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate(-1)} className="btn-cancel">
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn-submit" disabled={mutation.isLoading}>
            {mutation.isLoading ? t('travelRequest.submitting') : t('travelRequest.submitRequestButton')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SubmitTravelRequest

