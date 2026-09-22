import { supabase } from "@/lib/auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
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
    throw new Error(error?.message ?? "API request failed")
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

  delete: <T>(endpoint: string) => apiCall<T>(endpoint, { method: "DELETE" }),
}
