import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import './HomePortal.css'

const HomePortal = () => {
  const { user } = useAuth()
  const { t } = useTranslation()

  const modules = [
    {
      id: 'business-trips',
      title: t('portal.businessTrips'),
      description: t('portal.businessTripsDesc'),
      to: '/business-trips/dashboard',
      enabled: true,
    },
    {
      id: 'correspondence',
      title: t('portal.correspondence'),
      description: t('portal.correspondenceDesc'),
      to: '/correspondence/output/review',
      enabled: true,
    },
    {
      id: 'vacations',
      title: t('portal.vacations'),
      description: t('portal.vacationsDesc'),
      enabled: false,
    },
  ]

  return (
    <div className="home-portal">
      <h1>{t('portal.welcome')}, {user?.firstName}!</h1>
      <p className="home-portal-subtitle">{t('portal.selectModule')}</p>
      <div className="module-grid">
        {modules.map((mod) =>
          mod.enabled ? (
            <Link key={mod.id} to={mod.to} className="module-card">
              <h2>{mod.title}</h2>
              <p>{mod.description}</p>
            </Link>
          ) : (
            <div key={mod.id} className="module-card module-card--disabled" aria-disabled="true">
              <h2>{mod.title}</h2>
              <p>{mod.description}</p>
              <span className="module-card-badge">{t('portal.comingSoon')}</span>
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default HomePortal
