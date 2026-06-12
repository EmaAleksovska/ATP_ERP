import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { travelRequestService } from '../../services/travelRequestService'
import { format } from 'date-fns'
import './TravelRequest.css'

const RequestsForMyProjects = () => {
  const { t } = useTranslation()
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['requestsForMyProjects'],
    queryFn: () => travelRequestService.getRequestsForMyProjects(),
  })

  const approveMutation = useMutation({
    mutationFn: (id) => travelRequestService.approveRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['requestsForMyProjects'])
      queryClient.invalidateQueries(['myOrders'])
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => travelRequestService.rejectRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['requestsForMyProjects'])
      setRejectingId(null)
      setRejectionReason('')
    },
  })

  const handleApprove = async (id) => {
    if (window.confirm(t('travelRequest.confirmApprove'))) {
      await approveMutation.mutateAsync(id)
    }
  }

  const handleReject = async (id) => {
    if (rejectionReason.trim()) {
      await rejectMutation.mutateAsync({ id, reason: rejectionReason })
    } else {
      alert(t('travelRequest.enterRejectionReason'))
    }
  }

  if (isLoading) return <div>{t('common.loading')}</div>

  const pendingRequests = data?.travelRequests?.filter((r) => r.status === 'pending') || []
  const otherRequests = data?.travelRequests?.filter((r) => r.status !== 'pending') || []

  const getStatusBadge = (status) => {
    return t(`common.${status}`)
  }

  return (
    <div className="travel-requests">
      <h1>{t('travelRequest.requestsForMyProjects')}</h1>

      {pendingRequests.length > 0 && (
        <div className="request-section">
          <h2>{t('travelRequest.pendingApproval')}</h2>
          <div className="request-list">
            {pendingRequests.map((request) => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <h3>{request.project_name}</h3>
                  <span className="status-badge status-pending">{t('common.pending')}</span>
                </div>
                <div className="request-details">
                  <p>
                    <strong>{t('travelRequest.requester')}:</strong> {request.requester_first_name}{' '}
                    {request.requester_last_name} ({request.requester_email})
                  </p>
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
                <div className="request-actions">
                  <button
                    onClick={() => handleApprove(request.id)}
                    className="btn-approve"
                    disabled={approveMutation.isLoading}
                  >
                    {approveMutation.isLoading ? t('travelRequest.approving') : t('travelRequest.approve')}
                  </button>
                  {rejectingId === request.id ? (
                    <div className="reject-form">
                      <textarea
                        placeholder={t('travelRequest.rejectionReasonPlaceholder')}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                      />
                      <div className="reject-actions">
                        <button
                          onClick={() => handleReject(request.id)}
                          className="btn-reject"
                          disabled={rejectMutation.isLoading}
                        >
                          {t('travelRequest.confirmRejectButton')}
                        </button>
                        <button
                          onClick={() => {
                            setRejectingId(null)
                            setRejectionReason('')
                          }}
                          className="btn-cancel"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRejectingId(request.id)}
                      className="btn-reject"
                    >
                      {t('travelRequest.reject')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {otherRequests.length > 0 && (
        <div className="request-section">
          <h2>{t('travelRequest.otherRequests')}</h2>
          <div className="request-list">
            {otherRequests.map((request) => (
              <div key={request.id} className="request-card">
                <div className="request-header">
                  <h3>{request.project_name}</h3>
                  <span
                    className={`status-badge status-${request.status}`}
                  >
                    {getStatusBadge(request.status)}
                  </span>
                </div>
                <div className="request-details">
                  <p>
                    <strong>{t('travelRequest.requester')}:</strong> {request.requester_first_name}{' '}
                    {request.requester_last_name}
                  </p>
                  <p>
                    <strong>{t('common.destination')}:</strong> {request.location_city}{request.location_country ? `, ${request.location_country}` : ''}
                  </p>
                  <p>
                    <strong>{t('common.dates')}:</strong> {format(new Date(request.start_date), 'MMM dd, yyyy')} -{' '}
                    {format(new Date(request.end_date), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data?.travelRequests?.length === 0 && (
        <div className="empty-state">{t('travelRequest.noRequestsForProjects')}</div>
      )}
    </div>
  )
}

export default RequestsForMyProjects

