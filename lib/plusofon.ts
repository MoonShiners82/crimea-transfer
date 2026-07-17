const PLUSOFON_BASE = "https://api.plusofon.ru"
const PLUSOFON_API_KEY = process.env.PLUSOFON_API_KEY

if (!PLUSOFON_API_KEY) {
  throw new Error("PLUSOFON_API_KEY not set")
}

async function plusofonFetch<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${PLUSOFON_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${PLUSOFON_API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Plusofon API ${res.status}: ${text}`)
  }

  return res.json()
}

export interface FlashCallSendResponse {
  key: string
  operator?: string
  pin?: string
  error?: string
}

export interface FlashCallCheckResponse {
  success: boolean
  error?: string
}

export async function sendFlashCall(phone: string): Promise<FlashCallSendResponse> {
  return plusofonFetch<FlashCallSendResponse>("/api/v1/flash-call/send", { phone })
}

export async function checkFlashCallPin(key: string, pin: string): Promise<FlashCallCheckResponse> {
  return plusofonFetch<FlashCallCheckResponse>("/api/v1/flash-call/check", { key, pin })
}
