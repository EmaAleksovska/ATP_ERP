import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ProjectPickerModal from './ProjectPickerModal'
import { TYPE_OPTIONS, europeanToIso, isoToEuropean, formatTodayIso } from './columnConfig'

const emptyFilters = {
  project_id: '',
  type: '',
  number: '',
  client: '',
  sender: '',
  date: '',
}

const CorrespondenceFilters = ({ filters, onChange, onClear }) => {
  const { t } = useTranslation()
  const [showProjectPicker, setShowProjectPicker] = useState(false)

  const handleChange = (field, value) => {
    if (field === 'project_id') {
      onChange({
        ...filters,
        project_id: value,
        sender: '',
      })
      return
    }
    onChange({ ...filters, [field]: value })
  }

  const handleProjectSelect = ({ projectId, senderName }) => {
    onChange({
      ...filters,
      project_id: projectId,
      sender: senderName || '',
    })
    setShowProjectPicker(false)
  }

  return (
    <div className="correspondence-filters">
      <div className="correspondence-filters-row">
        <div className="filter-field filter-field--project">
          <label>{t('correspondence.projectId')}</label>
          <div className="filter-project-input">
            <input
              type="text"
              value={filters.project_id}
              onChange={(e) => handleChange('project_id', e.target.value)}
            />
            <button
              type="button"
              className="btn-secondary btn-compact"
              onClick={() => setShowProjectPicker(true)}
              title={t('correspondence.selectProject')}
            >
              …
            </button>
          </div>
        </div>

        <div className="filter-field">
          <label>{t('correspondence.type')}</label>
          <select
            value={filters.type}
            onChange={(e) => handleChange('type', e.target.value)}
          >
            <option value="">{t('correspondence.selectType')}</option>
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="filter-field filter-field--number">
          <label>{t('correspondence.number')}</label>
          <input
            type="number"
            value={filters.number}
            onChange={(e) => handleChange('number', e.target.value)}
          />
        </div>

        <div className="filter-field filter-field--client">
          <label>{t('correspondence.client')}</label>
          <input
            type="text"
            value={filters.client}
            onChange={(e) => handleChange('client', e.target.value)}
          />
        </div>

        <div className="filter-field filter-field--sender">
          <label>{t('correspondence.sender')}</label>
          <input
            type="text"
            value={filters.sender}
            onChange={(e) => handleChange('sender', e.target.value)}
          />
        </div>

        <div className="filter-field filter-field--date">
          <label>{t('correspondence.date')}</label>
          <input
            type="date"
            value={europeanToIso(filters.date)}
            max={formatTodayIso()}
            onChange={(e) => {
              const iso = e.target.value
              handleChange('date', iso ? isoToEuropean(iso) : '')
            }}
          />
        </div>

        <div className="filter-field filter-field--actions">
          <label>&nbsp;</label>
          <button type="button" className="btn-secondary btn-compact" onClick={onClear}>
            {t('correspondence.clearFilters')}
          </button>
        </div>
      </div>

      {showProjectPicker && (
        <ProjectPickerModal
          onSelect={handleProjectSelect}
          onClose={() => setShowProjectPicker(false)}
        />
      )}
    </div>
  )
}

export { emptyFilters }
export default CorrespondenceFilters
