const PLUSOFON_API_KEY = process.env.PLUSOFON_API_KEY
const PLUSOFON_BASE_URL = "https://restapi.plusofon.ru"

interface PlusofonResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
}

async function plusofonRequest<T = unknown>(
  path: string,
  options: { method?: string; body?: Record<string, unknown>; params?: Record<string, string> } = {}
): Promise<PlusofonResponse<T>> {
  const { method = "POST", body, params } = options

  let url = `${PLUSOFON_BASE_URL}${path}`
  if (params) {
    const searchParams = new URLSearchParams(params)
    url += `?${searchParams.toString()}`
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${PLUSOFON_API_KEY}`,
    "Client": "10553",
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json()

  if (!response.ok || !data.success) {
    throw new Error(data.message || `Plusofon API error (${response.status})`)
  }

  return data
}

export interface CallToAuthResponse {
  phone: string
  key: string
}

export async function requestReverseFlashCall(phone: string, hookUrl: string): Promise<CallToAuthResponse> {
  if (!PLUSOFON_API_KEY) {
    throw new Error("PLUSOFON_API_KEY must be set")
  }

  const result = await plusofonRequest<{ phone: string; key: string }>(
    "/api/v1/flash-call/call-to-auth",
    { body: { phone, hook_url: hookUrl } }
  )

  return { phone: result.data.phone, key: result.data.key }
}

export interface CheckStatusResponse {
  status: "pending" | "verified" | "expired" | "failed"
}

export async function checkCallbackStatus(key: string): Promise<CheckStatusResponse> {
  if (!PLUSOFON_API_KEY) {
    throw new Error("PLUSOFON_API_KEY must be set")
  }

  const result = await plusofonRequest<{ status: string }>(
    "/api/v1/flash-call/check",
    { params: { key } }
  )

  return { status: result.data.status as CheckStatusResponse["status"] }
}
