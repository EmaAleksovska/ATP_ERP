import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { travelRequestService } from '../services/travelRequestService'
import { travelOrderService } from '../services/travelOrderService'
import './Dashboard.css'

const Dashboard = () => {
  const { user, isAdmin } = useAuth()
  const { t } = useTranslation()

  const { data: myRequests } = useQuery({
    queryKey: ['myRequests'],
    queryFn: () => travelRequestService.getMyRequests(),
  })

  const { data: myOrders } = useQuery({
    queryKey: ['myOrders'],
    queryFn: () => travelOrderService.getMyOrders(),
  })

  const { data: requestsForMyProjects } = useQuery({
    queryKey: ['requestsForMyProjects'],
    queryFn: () => travelRequestService.getRequestsForMyProjects(),
    enabled: !isAdmin, // Only fetch if not admin
  })

  const pendingRequests = myRequests?.travelRequests?.filter(r => r.status === 'pending') || []
  const approvedRequests = myRequests?.travelRequests?.filter(r => r.status === 'approved') || []
  const pendingForApproval = requestsForMyProjects?.travelRequests?.filter(r => r.status === 'pending') || []

  return (
    <div className="dashboard">
      <h1>{t('dashboard.welcome')}, {user?.firstName}!</h1>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>{t('dashboard.myPendingRequests')}</h3>
          <p className="stat-number">{pendingRequests.length}</p>
        </div>
        <div className="stat-card">
          <h3>{t('dashboard.myApprovedRequests')}</h3>
          <p className="stat-number">{approvedRequests.length}</p>
        </div>
        <div className="stat-card">
          <h3>{t('dashboard.myTravelOrders')}</h3>
          <p className="stat-number">{myOrders?.travelOrders?.length || 0}</p>
        </div>
        {!isAdmin && (
          <div className="stat-card">
            <h3>{t('dashboard.pendingForMyApproval')}</h3>
            <p className="stat-number">{pendingForApproval.length}</p>
          </div>
        )}
      </div>

      <div className="dashboard-sections">
        {pendingForApproval.length > 0 && (
          <div className="dashboard-section">
            <h2>{t('dashboard.requestsRequiringApproval')}</h2>
            <div className="request-list">
              {pendingForApproval.slice(0, 5).map((request) => (
                <div key={request.id} className="request-item">
                  <div>
                    <strong>{request.project_name}</strong>
                    <p>{request.location_city}{request.location_country ? `, ${request.location_country}` : ''}</p>
                  </div>
                  <div>
                    {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pendingRequests.length > 0 && (
          <div className="dashboard-section">
            <h2>{t('dashboard.myPendingRequestsSection')}</h2>
            <div className="request-list">
              {pendingRequests.slice(0, 5).map((request) => (
                <div key={request.id} className="request-item">
                  <div>
                    <strong>{request.project_name}</strong>
                    <p>{request.location_city}{request.location_country ? `, ${request.location_country}` : ''}</p>
                  </div>
                  <div>{t('common.status')}: <span className="status-pending">{t('common.pending')}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard

