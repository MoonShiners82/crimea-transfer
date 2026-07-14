import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

function normalizePhone(phone: string): string {
  let clean = phone.replace(/\D/g, "")
  if (clean.startsWith("8")) clean = "7" + clean.slice(1)
  if (!clean.startsWith("7")) clean = "7" + clean
  return "+" + clean
}

async function main() {
  const phone = process.argv[2]
  const password = process.argv[3]

  if (!phone || !password) {
    console.log("Использование: npx tsx scripts/set-admin-password.ts <телефон> <пароль>")
    console.log("Пример: npx tsx scripts/set-admin-password.ts +79781234567 mypassword123")
    process.exit(1)
  }

  if (password.length < 6) {
    console.log("Ошибка: пароль минимум 6 символов")
    process.exit(1)
  }

  const normalizedPhone = normalizePhone(phone)
  const passwordHash = await bcrypt.hash(password, 10)

  const existing = await prisma.user.findUnique({ where: { phone: normalizedPhone } })

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, role: "admin" }
    })
    console.log(`Пользователь ${normalizedPhone} обновлён: пароль установлен, роль = admin`)
  } else {
    await prisma.user.create({
      data: { phone: normalizedPhone, passwordHash, role: "admin" }
    })
    console.log(`Пользователь ${normalizedPhone} создан: пароль установлен, роль = admin`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
