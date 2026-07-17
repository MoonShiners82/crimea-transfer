const PLUSOFON_API_KEY = process.env.PLUSOFON_API_KEY
const PLUSOFON_BASE_URL = "https://restapi.plusofon.ru"
const PLUSOFON_CLIENT = "10553"

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
    "Accept": "application/json",
    "Client": PLUSOFON_CLIENT,
    "Authorization": `Bearer ${PLUSOFON_API_KEY}`,
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const json = await response.json()

  if (!response.ok) {
    const msg = (json as { message?: string }).message || `HTTP ${response.status}`
    throw new Error(`Plusofon API error: ${msg}`)
  }

  return json as PlusofonResponse<T>
}

export interface CallToAuthResponse {
  key: string
  phone: string
}

export async function requestCallback(phone: string, hookUrl: string): Promise<CallToAuthResponse> {
  if (!PLUSOFON_API_KEY) {
    throw new Error("PLUSOFON_API_KEY must be set")
  }

  const result = await plusofonRequest<CallToAuthResponse>(
    "/api/v1/flash-call/call-to-auth",
    { body: { phone, hook_url: hookUrl } }
  )

  if (!result.success || !result.data) {
    throw new Error(result.message || "Plusofon call-to-auth request failed")
  }

  return result.data
}

export interface WebhookPayload {
  phone: string
  key: string
}

export function parseWebhook(body: unknown): WebhookPayload | null {
  const data = body as Record<string, unknown>
  if (typeof data?.phone === "string" && typeof data?.key === "string") {
    return { phone: data.phone, key: data.key }
  }
  return null
}
