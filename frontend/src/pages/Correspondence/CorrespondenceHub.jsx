import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import '../../components/Layout/LanguageSwitcher.css'
import './CorrespondenceHub.css'

const CorrespondenceHub = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [side, setSide] = useState('output')

  const goToMode = (mode) => {
    navigate(`/correspondence/${side}/${mode}`)
  }

  return (
    <div className="correspondence-hub">
      <h1>{t('correspondence.moduleTitle')}</h1>

      <div className="correspondence-side-toggle">
        <div className="language-switcher">
          <button
            type="button"
            className={`lang-btn ${side === 'input' ? 'active' : ''}`}
            onClick={() => setSide('input')}
          >
            {t('correspondence.ingoing')}
          </button>
          <button
            type="button"
            className={`lang-btn ${side === 'output' ? 'active' : ''}`}
            onClick={() => setSide('output')}
          >
            {t('correspondence.outgoing')}
          </button>
        </div>
      </div>

      <div className="correspondence-mode-buttons">
        <button type="button" className="btn-primary" onClick={() => goToMode('new')}>
          {t('correspondence.modeNew')}
        </button>
        <button type="button" className="btn-secondary" onClick={() => goToMode('review')}>
          {t('correspondence.modeReview')}
        </button>
        <button type="button" className="btn-secondary" onClick={() => goToMode('edit')}>
          {t('correspondence.modeEdit')}
        </button>
      </div>
    </div>
  )
}

export default CorrespondenceHub
