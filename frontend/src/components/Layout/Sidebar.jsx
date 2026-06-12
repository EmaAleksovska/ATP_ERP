import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import './Sidebar.css'

const Sidebar = ({ isOpen, onClose }) => {
  const { isAdmin } = useAuth()
  const { t } = useTranslation()

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}></div>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className="nav-link" onClick={onClose}>
            {t('nav.dashboard')}
          </NavLink>
          <NavLink to="/profile" className="nav-link" onClick={onClose}>
            {t('nav.profile')}
          </NavLink>
          
          {isAdmin && (
            <>
              <div className="nav-section">{t('nav.admin')}</div>
              <NavLink to="/admin/users" className="nav-link" onClick={onClose}>
                {t('nav.userManagement')}
              </NavLink>
              <NavLink to="/admin/projects" className="nav-link" onClick={onClose}>
                {t('nav.projectManagement')}
              </NavLink>
            </>
          )}
          
          <div className="nav-section">{t('nav.travelRequests')}</div>
          <NavLink to="/travel-requests/submit" className="nav-link" onClick={onClose}>
            {t('nav.submitRequest')}
          </NavLink>
          <NavLink to="/travel-requests/my-requests" className="nav-link" onClick={onClose}>
            {t('nav.myRequests')}
          </NavLink>
          <NavLink to="/travel-requests/my-projects" className="nav-link" onClick={onClose}>
            {t('nav.requestsForMyProjects')}
          </NavLink>
          
          <div className="nav-section">{t('nav.travelOrders')}</div>
          <NavLink to="/travel-orders" className="nav-link" onClick={onClose}>
            {t('nav.myTravelOrders')}
          </NavLink>
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
