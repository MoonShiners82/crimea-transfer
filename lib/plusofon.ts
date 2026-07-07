const PLUSOFON_API_KEY = process.env.PLUSOFON_API_KEY
const PLUSOFON_BASE_URL = "https://api.plusofon.ru"

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
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Plusofon API error (${response.status}): ${errorText}`)
  }

  return response.json()
}

export interface CallToAuthResponse {
  request_id: string
  phone: string
}

export async function requestCallback(phone: string): Promise<CallToAuthResponse> {
  if (!PLUSOFON_API_KEY) {
    throw new Error("PLUSOFON_API_KEY must be set")
  }

  const result = await plusofonRequest<CallToAuthResponse>(
    "/v1/flash-call/call-to-auth",
    { body: { phone } }
  )

  if (!result.success || !result.data) {
    throw new Error(result.message || "Plusofon request failed")
  }

  return result.data
}

export interface CheckStatusResponse {
  status: "pending" | "verified" | "expired" | "failed"
}

export async function checkCallbackStatus(requestId: string): Promise<CheckStatusResponse> {
  if (!PLUSOFON_API_KEY) {
    throw new Error("PLUSOFON_API_KEY must be set")
  }

  const result = await plusofonRequest<CheckStatusResponse>(
    "/v1/flash-call/check",
    { params: { request_id: requestId } }
  )

  if (!result.data) {
    throw new Error("Plusofon check failed")
  }

  return result.data
}
