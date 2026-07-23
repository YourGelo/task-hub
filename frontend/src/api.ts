export type ApiProblem = {
  code: string
  message: string
  details: unknown
  request_id?: string
}

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:7801'
).replace(/\/$/, '')

export function normalizeApiProblem(error: unknown): ApiProblem {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  ) {
    return error as ApiProblem
  }

  return {
    code: 'NETWORK_ERROR',
    message: error instanceof Error ? error.message : 'Не удалось выполнить запрос',
    details: [],
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: init?.body
        ? { 'Content-Type': 'application/json', ...init.headers }
        : init?.headers,
    })
  } catch {
    throw {
      code: 'NETWORK_ERROR',
      message: `Backend недоступен по адресу ${API_BASE_URL}`,
      details: [],
    } satisfies ApiProblem
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw (
      payload?.error ?? {
        code: `HTTP_${response.status}`,
        message: response.statusText || 'Ошибка запроса',
        details: [],
      }
    )
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
