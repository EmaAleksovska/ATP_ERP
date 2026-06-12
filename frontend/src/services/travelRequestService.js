import api from './api'

export const travelRequestService = {
  submitRequest: async (requestData) => {
    const response = await api.post('/travel-requests', requestData)
    return response.data
  },

  getMyRequests: async () => {
    const response = await api.get('/travel-requests/my-requests')
    return response.data
  },

  getRequestsForMyProjects: async () => {
    const response = await api.get('/travel-requests/my-projects')
    return response.data
  },

  getAllRequests: async () => {
    const response = await api.get('/travel-requests')
    return response.data
  },

  getRequestById: async (id) => {
    const response = await api.get(`/travel-requests/${id}`)
    return response.data
  },

  approveRequest: async (id) => {
    const response = await api.patch(`/travel-requests/${id}/approve`)
    return response.data
  },

  rejectRequest: async (id, rejectionReason) => {
    const response = await api.patch(`/travel-requests/${id}/reject`, { rejectionReason })
    return response.data
  },

  getApprovedCities: async () => {
    const response = await api.get('/travel-requests/approved-cities')
    return response.data
  },
}

