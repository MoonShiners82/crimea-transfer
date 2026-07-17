interface PendingVerification {
  phone: string
  status: "pending" | "verified"
  createdAt: number
}

const store = new Map<string, PendingVerification>()

const TTL_MS = 5 * 60 * 1000

export function createVerification(key: string, phone: string): void {
  cleanup()
  store.set(key, { phone, status: "pending", createdAt: Date.now() })
}

export function verifyKey(key: string): PendingVerification | null {
  const entry = store.get(key)
  if (!entry) return null
  return entry
}

export function markVerified(key: string): boolean {
  const entry = store.get(key)
  if (!entry) return false
  entry.status = "verified"
  return true
}

export function deleteVerification(key: string): void {
  store.delete(key)
}

function cleanup() {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now - entry.createdAt > TTL_MS) {
      store.delete(key)
    }
  }
}
