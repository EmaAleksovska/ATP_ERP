import api from './api'

function createCorrespondenceService(basePath) {
  const fetchPdfBlob = async (id) => {
    const response = await api.get(`${basePath}/${id}/download`, {
      responseType: 'blob',
    })
    return response.data
  }

  return {
    getAll: async (filters = {}) => {
      const response = await api.get(basePath, { params: filters })
      return response.data
    },

    getById: async (id) => {
      const response = await api.get(`${basePath}/${id}`)
      return response.data
    },

    getNumbers: async (projectId, excludeId) => {
      const response = await api.get(`${basePath}/numbers`, {
        params: { projectId, excludeId },
      })
      return response.data
    },

    checkEditPermission: async (id) => {
      const response = await api.get(`${basePath}/${id}/permission`)
      return response.data
    },

    create: async (data) => {
      const response = await api.post(basePath, data)
      return response.data
    },

    update: async (id, data) => {
      const response = await api.put(`${basePath}/${id}`, data)
      return response.data
    },

    delete: async (id) => {
      const response = await api.delete(`${basePath}/${id}`)
      return response.data
    },

    uploadPdf: async (id, file) => {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(new Error('Failed to read PDF file'))
        reader.readAsDataURL(file)
      })

      const response = await api.post(`${basePath}/${id}/pdf`, { pdf: base64 })
      return response.data
    },

    fetchPdfBlob,

    downloadPdf: async (id, fileName = 'correspondence.pdf') => {
      const data = await fetchPdfBlob(id)
      const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    },

    viewPdf: async (id) => {
      const data = await fetchPdfBlob(id)
      const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => window.URL.revokeObjectURL(url), 60_000)
    },
  }
}

export const inputCorrespondenceService = createCorrespondenceService('/input-correspondence')
export const outputCorrespondenceService = createCorrespondenceService('/output-correspondence')

export function getCorrespondenceService(side) {
  return side === 'input' ? inputCorrespondenceService : outputCorrespondenceService
}
