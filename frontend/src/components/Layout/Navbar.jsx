import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import LanguageSwitcher from './LanguageSwitcher'
import './Navbar.css'

const Navbar = ({ onMenuClick, showMenu = true }) => {
  const { user, logout } = useAuth()
  const { t } = useTranslation()

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-left">
          {showMenu && (
            <button className="hamburger-btn" onClick={onMenuClick} aria-label="Toggle menu">
              <span></span>
              <span></span>
              <span></span>
            </button>
          )}
          <Link to="/" className="navbar-brand">
            {t('app.name')}
          </Link>
        </div>
        <div className="navbar-right">
          <LanguageSwitcher />
          <span className="navbar-user">
            {user?.firstName} {user?.lastName} ({user?.role})
          </span>
          <button onClick={handleLogout} className="btn-logout">
            {t('common.logout')}
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
