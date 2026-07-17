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

export interface SendFlashCallResponse {
  key: string
  operator?: string
  pin?: string
}

export async function sendFlashCall(phone: string, pin?: string): Promise<SendFlashCallResponse> {
  if (!PLUSOFON_API_KEY) {
    throw new Error("PLUSOFON_API_KEY must be set")
  }

  const body: Record<string, string> = { phone }
  if (pin) body.pin = pin

  const result = await plusofonRequest<SendFlashCallResponse>(
    "/api/v1/flash-call/send",
    { body }
  )

  if (!result.success || !result.data) {
    throw new Error(result.message || "Plusofon flash call send failed")
  }

  return result.data
}

export interface CheckFlashCallResponse {
  key: string
  status?: string
}

export async function checkFlashCall(key: string, pin: string): Promise<CheckFlashCallResponse> {
  if (!PLUSOFON_API_KEY) {
    throw new Error("PLUSOFON_API_KEY must be set")
  }

  const result = await plusofonRequest<CheckFlashCallResponse>(
    "/api/v1/flash-call/check",
    { body: { key, pin } }
  )

  if (!result.success || !result.data) {
    throw new Error(result.message || "Plusofon flash call check failed")
  }

  return result.data
}

export function generatePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}
