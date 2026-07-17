import { prisma } from "./prisma"

export async function createVerification(key: string, phone: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
  await prisma.flashCallVerification.create({
    data: { key, phone, status: "pending", expiresAt },
  })
}

export async function verifyKey(key: string) {
  const entry = await prisma.flashCallVerification.findUnique({ where: { key } })
  if (!entry) return null
  if (entry.expiresAt < new Date()) {
    await prisma.flashCallVerification.delete({ where: { key } })
    return null
  }
  return entry
}

export async function markVerified(key: string): Promise<boolean> {
  const entry = await prisma.flashCallVerification.findUnique({ where: { key } })
  if (!entry) return false
  await prisma.flashCallVerification.update({
    where: { key },
    data: { status: "verified" },
  })
  return true
}

export async function deleteVerification(key: string): Promise<void> {
  await prisma.flashCallVerification.deleteMany({ where: { key } })
}
