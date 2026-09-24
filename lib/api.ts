import { supabase } from "@/lib/auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL

/** Thrown on a non-ok response. Carries the status and full parsed body so
 * callers can branch on specifics (e.g. a 409 with { workItemsCount }), not just
 * the message string. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token

  const isFormData = options.body instanceof FormData

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string> | undefined),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new ApiError(
      error?.message ?? "API request failed",
      response.status,
      error
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

export const api = {
  get: <T>(endpoint: string) => apiCall<T>(endpoint, { method: "GET" }),

  post: <T>(endpoint: string, data: unknown) =>
    apiCall<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  put: <T>(endpoint: string, data: unknown) =>
    apiCall<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: <T>(endpoint: string, data?: unknown) =>
    apiCall<T>(endpoint, {
      method: "DELETE",
      ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
    }),

  patch: <T>(endpoint: string, data: unknown) =>
    apiCall<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  upload: <T>(endpoint: string, formData: FormData) =>
    apiCall<T>(endpoint, { method: "POST", body: formData }),
}
