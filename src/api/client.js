const BASE = '/api'

export function getToken() {
  return localStorage.getItem('devileye-token')
}

export function setToken(t) {
  localStorage.setItem('devileye-token', t)
}

export function clearToken() {
  localStorage.removeItem('devileye-token')
  localStorage.removeItem('devileye-user')
}

async function request(path, options = {}) {
  const token = getToken()
  const isFormData = options.body instanceof FormData

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  let res
  try {
    res = await fetch(`${BASE}${path}`, { ...options, headers })
  } catch (networkErr) {
    throw new Error('Sem conexão com o servidor. Verifique sua rede.')
  }

  if (res.status === 401) {
    clearToken()
    window.location.href = `${import.meta.env.BASE_URL}login`
    throw new Error('Sessão expirada. Faça login novamente.')
  }

  if (res.status === 204) return null

  const data = await res.json().catch(() => ({ message: res.statusText }))
  if (!res.ok) throw new Error(data.message || `Erro ${res.status}`)
  return data
}

export const api = {
  get:    (path) => request(path),
  post:   (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put:    (path, body) => request(path, { method: 'PUT',  body: JSON.stringify(body) }),
  patch:  (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
  upload: (path, formData) => request(path, { method: 'POST', body: formData }),
}
