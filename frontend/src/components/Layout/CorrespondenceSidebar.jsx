import { NavLink, useLocation } from 'react-router-dom'

import { useTranslation } from 'react-i18next'

import '../Layout/Sidebar.css'

import './CorrespondenceSidebar.css'



const convexClass = ({ isActive }) =>

  `correspondence-convex-btn${isActive ? ' active' : ''}`



const CorrespondenceSidebar = ({ isOpen, onClose }) => {

  const { t } = useTranslation()

  const { pathname } = useLocation()

  const side = pathname.includes('/correspondence/input/') ? 'input' : 'output'

  const modeMatch = pathname.match(/\/correspondence\/(?:input|output)\/(new|review)/)

  const mode = modeMatch?.[1] || 'review'



  return (

    <>

      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}></div>

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>

        <nav className="sidebar-nav">

          <NavLink to="/" className="correspondence-sidebar-exit convex-btn" onClick={onClose}>

            {t('correspondence.backToPortal')}

          </NavLink>



          <div className="correspondence-side-toggle">

            <NavLink

              to={`/correspondence/input/${mode}`}

              className={({ isActive }) =>

                `correspondence-toggle-btn ${convexClass({ isActive })}`

              }

              onClick={onClose}

            >

              {t('correspondence.ingoing')}

            </NavLink>

            <NavLink

              to={`/correspondence/output/${mode}`}

              className={({ isActive }) =>

                `correspondence-toggle-btn ${convexClass({ isActive })}`

              }

              onClick={onClose}

            >

              {t('correspondence.outgoing')}

            </NavLink>

          </div>



          <div className="correspondence-mode-nav">

            <NavLink

              to={`/correspondence/${side}/new`}

              className={({ isActive }) =>

                `correspondence-mode-btn ${convexClass({ isActive })}`

              }

              onClick={onClose}

            >

              {t('correspondence.modeNew')}

            </NavLink>

            <NavLink

              to={`/correspondence/${side}/review`}

              className={({ isActive }) =>

                `correspondence-mode-btn ${convexClass({ isActive })}`

              }

              onClick={onClose}

            >

              {t('correspondence.modeReview')}

            </NavLink>

          </div>

        </nav>

      </aside>

    </>

  )

}



export default CorrespondenceSidebar

