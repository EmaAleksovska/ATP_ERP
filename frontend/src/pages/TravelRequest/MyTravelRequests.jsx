import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { travelRequestService } from '../../services/travelRequestService'
import { format } from 'date-fns'
import './TravelRequest.css'

const MyTravelRequests = () => {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['myRequests'],
    queryFn: () => travelRequestService.getMyRequests(),
  })

  if (isLoading) return <div>{t('common.loading')}</div>

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: '#fef3c7', color: '#92400e' },
      approved: { bg: '#d1fae5', color: '#065f46' },
      rejected: { bg: '#fee2e2', color: '#991b1b' },
    }
    const style = styles[status] || styles.pending
    return (
      <span
        className="status-badge"
        style={{ backgroundColor: style.bg, color: style.color }}
      >
        {t(`common.${status}`)}
      </span>
    )
  }

  return (
    <div className="travel-requests">
      <h1>{t('travelRequest.myTravelRequests')}</h1>

      {data?.travelRequests?.length === 0 ? (
        <div className="empty-state">{t('travelRequest.noTravelRequests')}</div>
      ) : (
        <div className="request-list">
          {data?.travelRequests?.map((request) => (
            <div key={request.id} className="request-card">
              <div className="request-header">
                <h3>{request.project_name}</h3>
                {getStatusBadge(request.status)}
              </div>
              <div className="request-details">
                <p>
                  <strong>{t('common.destination')}:</strong> {request.location_city}{request.location_country ? `, ${request.location_country}` : ''}
                </p>
                <p>
                  <strong>{t('common.dates')}:</strong> {format(new Date(request.start_date), 'MMM dd, yyyy')} -{' '}
                  {format(new Date(request.end_date), 'MMM dd, yyyy')}
                </p>
                <p>
                  <strong>{t('common.dailyAllowance')}:</strong> €{parseFloat(request.daily_allowance).toFixed(2)}
                </p>
                {request.notes && (
                  <p>
                    <strong>{t('common.notes')}:</strong> {request.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyTravelRequests

