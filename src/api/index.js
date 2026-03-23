import { api, setToken, clearToken, getToken } from './client'

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  me: () => api.get('/auth/me'),
  changePassword: (currentPassword, newPassword) => api.put('/auth/password', { currentPassword, newPassword }),
}

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: () => api.get('/users'),
}

// ─── Cases ────────────────────────────────────────────────────────────────────
export const casesApi = {
  list:   (params = {}) => api.get(`/cases?${new URLSearchParams(params)}`),
  get:    (id) => api.get(`/cases/${id}`),
  create: (data) => api.post('/cases', data),
  update: (id, data) => api.put(`/cases/${id}`, data),
  delete: (id) => api.delete(`/cases/${id}`),
}

// ─── Profiles ─────────────────────────────────────────────────────────────────
export const profilesApi = {
  list:   (caseId) => api.get(`/cases/${caseId}/profiles`),
  create: (caseId, data) => api.post(`/cases/${caseId}/profiles`, data),
  update: (profileId, data) => api.put(`/profiles/${profileId}`, data),
  delete: (profileId) => api.delete(`/profiles/${profileId}`),
}

// ─── Notes ────────────────────────────────────────────────────────────────────
export const notesApi = {
  list:   (caseId) => api.get(`/cases/${caseId}/notes`),
  create: (caseId, data) => api.post(`/cases/${caseId}/notes`, data),
  update: (noteId, data) => api.put(`/notes/${noteId}`, data),
  delete: (noteId) => api.delete(`/notes/${noteId}`),
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const tasksApi = {
  list:   (caseId) => api.get(`/cases/${caseId}/tasks`),
  create: (caseId, data) => api.post(`/cases/${caseId}/tasks`, data),
  update: (taskId, data) => api.put(`/tasks/${taskId}`, data),
  delete: (taskId) => api.delete(`/tasks/${taskId}`),
}

// ─── Queries ──────────────────────────────────────────────────────────────────
export const queriesApi = {
  list:   (caseId) => api.get(`/cases/${caseId}/queries`),
  create: (caseId, data) => api.post(`/cases/${caseId}/queries`, data),
  update: (queryId, data) => api.put(`/queries/${queryId}`, data),
  delete: (queryId) => api.delete(`/queries/${queryId}`),
}

// ─── Attachments ──────────────────────────────────────────────────────────────
export const attachmentsApi = {
  list:     (caseId) => api.get(`/cases/${caseId}/attachments`),
  upload:   (caseId, formData) => api.upload(`/cases/${caseId}/attachments`, formData),
  download: (id) => `/api/attachments/${id}/download`,
  delete:   (id) => api.delete(`/attachments/${id}`),
}

// ─── Timeline ─────────────────────────────────────────────────────────────────
export const timelineApi = {
  list:   (caseId, type) => api.get(`/cases/${caseId}/timeline${type ? `?type=${type}` : ''}`),
  create: (caseId, data) => api.post(`/cases/${caseId}/timeline`, data),
}

// ─── Organogram ───────────────────────────────────────────────────────────────
export const organogramApi = {
  get:  (caseId) => api.get(`/cases/${caseId}/organogram`),
  save: (caseId, data) => api.put(`/cases/${caseId}/organogram`, data),
}

// ─── Mural ────────────────────────────────────────────────────────────────────
export const muralApi = {
  list:   (caseId) => api.get(`/cases/${caseId}/mural`),
  create: (caseId, data) => api.post(`/cases/${caseId}/mural`, data),
  update: (itemId, data) => api.put(`/mural/${itemId}`, data),
  delete: (itemId) => api.delete(`/mural/${itemId}`),
}

export { setToken, clearToken, getToken }
