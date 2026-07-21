const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

type ApiEnvelope<T> = { success: boolean; data?: T; error?: { code: string; message: string; details?: unknown } }

export function getApiUrl() {
  return API_URL
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('rtdoc:token')
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  const payload = await response.json().catch(() => null) as ApiEnvelope<T> | T | null
  if (!response.ok) {
    const message = isApiEnvelope(payload) && payload.error ? `${payload.error.code}: ${payload.error.message}` : 'Request failed'
    throw new Error(message)
  }
  if (isApiEnvelope(payload)) return payload.data as T
  return payload as T
}

function isApiEnvelope<T>(payload: ApiEnvelope<T> | T | null): payload is ApiEnvelope<T> {
  return typeof payload === 'object' && payload !== null && 'success' in payload
}