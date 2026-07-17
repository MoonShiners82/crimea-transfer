const YOOKASSA_SHOP_ID = process.env.YOOKASSA_SHOP_ID
const YOOKASSA_SECRET_KEY = process.env.YOOKASSA_SECRET_KEY
const YOOKASSA_API_BASE = "https://api.yookassa.ru/v3"

function getAuthHeader(): string {
  if (!YOOKASSA_SHOP_ID || !YOOKASSA_SECRET_KEY) {
    throw new Error("YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY must be set")
  }
  const credentials = Buffer.from(`${YOOKASSA_SHOP_ID}:${YOOKASSA_SECRET_KEY}`).toString("base64")
  return `Basic ${credentials}`
}

export async function createPayment(amount: number, bookingId: string, returnUrl: string) {
  const idempotencyKey = crypto.randomUUID()
  
  const body = {
    amount: {
      value: (amount / 100).toFixed(2),
      currency: "RUB",
    },
    capture: true,
    confirmation: {
      type: "redirect",
      return_url: returnUrl,
    },
    description: `Трансфер #${bookingId}`,
    metadata: {
      bookingId,
    },
  }

  const response = await fetch(`${YOOKASSA_API_BASE}/payments`, {
    method: "POST",
    headers: {
      "Authorization": getAuthHeader(),
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`YooKassa create payment failed: ${error}`)
  }

  return response.json()
}

export async function capturePayment(paymentId: string) {
  const idempotencyKey = crypto.randomUUID()
  
  const response = await fetch(`${YOOKASSA_API_BASE}/payments/${paymentId}/capture`, {
    method: "POST",
    headers: {
      "Authorization": getAuthHeader(),
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`YooKassa capture payment failed: ${error}`)
  }

  return response.json()
}

export async function cancelPayment(paymentId: string) {
  const idempotencyKey = crypto.randomUUID()
  
  const response = await fetch(`${YOOKASSA_API_BASE}/payments/${paymentId}/cancel`, {
    method: "POST",
    headers: {
      "Authorization": getAuthHeader(),
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`YooKassa cancel payment failed: ${error}`)
  }

  return response.json()
}

export function handleWebhook(body: Record<string, unknown>) {
  const event = body.event as string
  const payment = body.object as Record<string, unknown>

  return {
    event,
    paymentId: payment.id as string,
    status: payment.status as string,
    metadata: payment.metadata as Record<string, string> | undefined,
  }
}
