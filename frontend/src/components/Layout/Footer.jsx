import { useTranslation } from 'react-i18next'
import './Footer.css'

const Footer = () => {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-left">
          <span className="company-name">{t('app.companyName')}</span>
        </div>
        <div className="footer-right">
          <span className="copyright">© {currentYear}</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer



