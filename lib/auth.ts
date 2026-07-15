export function normalizePhone(phone: string): string {
  let clean = phone.replace(/\D/g, "")
  if (clean.startsWith("8")) clean = "7" + clean.slice(1)
  if (!clean.startsWith("7")) clean = "7" + clean
  return "+" + clean
}
