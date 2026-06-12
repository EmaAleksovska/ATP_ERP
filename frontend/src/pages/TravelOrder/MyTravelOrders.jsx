import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { travelOrderService } from '../../services/travelOrderService'
import { format } from 'date-fns'
import './TravelOrder.css'

const MyTravelOrders = () => {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['myOrders'],
    queryFn: () => travelOrderService.getMyOrders(),
  })

  const handleDownload = async (id) => {
    try {
      await travelOrderService.downloadOrderPDF(id)
    } catch (error) {
      alert(t('travelOrder.errorDownloading') + ': ' + (error.response?.data?.message || error.message))
    }
  }

  if (isLoading) return <div>{t('common.loading')}</div>

  return (
    <div className="travel-orders">
      <h1>{t('travelOrder.myTravelOrders')}</h1>

      {data?.travelOrders?.length === 0 ? (
        <div className="empty-state">{t('travelOrder.noTravelOrders')}</div>
      ) : (
        <div className="order-list">
          {data?.travelOrders?.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <h3>{t('travelOrder.orderNumber')}: {order.order_number}</h3>
                <button
                  onClick={() => handleDownload(order.id)}
                  className="btn-download"
                >
                  {t('travelOrder.downloadPdf')}
                </button>
              </div>
              <div className="order-details">
                <p>
                  <strong>{t('common.project')}:</strong> {order.project_name} ({order.project_id})
                </p>
                <p>
                  <strong>{t('common.destination')}:</strong> {order.location_city}{order.location_country ? `, ${order.location_country}` : ''}
                </p>
                <p>
                  <strong>{t('travelRequest.travelDates')}:</strong> {format(new Date(order.start_date), 'MMM dd, yyyy')} -{' '}
                  {format(new Date(order.end_date), 'MMM dd, yyyy')}
                </p>
                <p>
                  <strong>{t('common.dailyAllowance')}:</strong> €{parseFloat(order.daily_allowance).toFixed(2)}
                </p>
                <p>
                  <strong>{t('travelOrder.approvedBy')}:</strong> {order.approver_first_name} {order.approver_last_name}
                </p>
                <p>
                  <strong>{t('travelOrder.approvalDate')}:</strong> {format(new Date(order.approval_date), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyTravelOrders

