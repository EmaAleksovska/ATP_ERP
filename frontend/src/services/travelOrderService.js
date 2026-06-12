import api from './api'

export const travelOrderService = {
  getMyOrders: async () => {
    const response = await api.get('/travel-orders/my-orders')
    return response.data
  },

  getOrderById: async (id) => {
    const response = await api.get(`/travel-orders/${id}`)
    return response.data
  },

  downloadOrderPDF: async (id) => {
    const response = await api.get(`/travel-orders/${id}/download`, {
      responseType: 'blob',
    })
    
    // Create blob URL and trigger download
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers['content-disposition']
    let filename = 'travel-order.pdf'
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i)
      if (filenameMatch) {
        filename = filenameMatch[1]
      }
    }
    
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },
}

