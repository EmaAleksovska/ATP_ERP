import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import './Profile.css'

const Profile = () => {
  const { user } = useAuth()
  const { t } = useTranslation()

  return (
    <div className="profile">
      <h1>{t('profile.myProfile')}</h1>
      <div className="profile-card">
        <div className="profile-field">
          <label>{t('common.firstName')}</label>
          <p>{user?.firstName}</p>
        </div>
        <div className="profile-field">
          <label>{t('common.lastName')}</label>
          <p>{user?.lastName}</p>
        </div>
        <div className="profile-field">
          <label>{t('common.email')}</label>
          <p>{user?.email}</p>
        </div>
        <div className="profile-field">
          <label>{t('common.role')}</label>
          <p className="role-badge">{user?.role}</p>
        </div>
        <div className="profile-field">
          <label>{t('common.status')}</label>
          <p className={`status-badge ${user?.status}`}>{t(`common.${user?.status}`)}</p>
        </div>
      </div>
    </div>
  )
}

export default Profile

