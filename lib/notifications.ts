interface NotificationChannel {
  send(params: { to: string; message: string; subject?: string; html?: string }): Promise<boolean>
}

interface SmsProvider extends NotificationChannel {}
interface EmailProvider extends NotificationChannel {}
interface TelegramProvider extends NotificationChannel {}

class SmsRuProvider implements SmsProvider {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async send(params: { to: string; message: string }): Promise<boolean> {
    try {
      const response = await fetch("https://sms.ru/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          api_id: this.apiKey,
          to: params.to,
          msg: params.message,
          json: "1"
        })
      })

      if (!response.ok) {
        console.error(`[SMS] Failed to send to ${params.to}: ${response.status}`)
        return false
      }

      const data = await response.json()
      console.log(`[SMS] Sent to ${params.to}:`, data)
      return true
    } catch (error) {
      console.error(`[SMS] Error sending to ${params.to}:`, error)
      return false
    }
  }
}

class ResendEmailProvider implements EmailProvider {
  private apiKey: string
  private from: string

  constructor(apiKey: string, from: string) {
    this.apiKey = apiKey
    this.from = from
  }

  async send(params: { to: string; message: string; subject: string; html?: string }): Promise<boolean> {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: this.from,
          to: params.to,
          subject: params.subject,
          html: params.html || params.message
        })
      })

      if (!response.ok) {
        console.error(`[Email] Failed to send to ${params.to}: ${response.status}`)
        return false
      }

      console.log(`[Email] Sent to ${params.to}`)
      return true
    } catch (error) {
      console.error(`[Email] Error sending to ${params.to}:`, error)
      return false
    }
  }
}

class TelegramBotProvider implements TelegramProvider {
  private botToken: string
  private chatId: string

  constructor(botToken: string, chatId: string) {
    this.botToken = botToken
    this.chatId = chatId
  }

  async send(params: { to: string; message: string }): Promise<boolean> {
    try {
      const chatId = params.to || this.chatId
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: params.message,
          parse_mode: "HTML"
        })
      })

      if (!response.ok) {
        console.error(`[Telegram] Failed to send to ${chatId}: ${response.status}`)
        return false
      }

      console.log(`[Telegram] Sent to ${chatId}`)
      return true
    } catch (error) {
      console.error(`[Telegram] Error sending to ${params.to || this.chatId}:`, error)
      return false
    }
  }
}

function getProviders(): { sms: SmsProvider | null; email: EmailProvider | null; telegram: TelegramProvider | null } {
  const smsApiKey = process.env.SMS_API_KEY
  const resendApiKey = process.env.RESEND_API_KEY
  const smtpFrom = process.env.SMTP_FROM || "noreply@crimea-transfer.ru"
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN
  const telegramChatId = process.env.TELEGRAM_CHAT_ID

  const sms = smsApiKey ? new SmsRuProvider(smsApiKey) : null
  const email = resendApiKey ? new ResendEmailProvider(resendApiKey, smtpFrom) : null
  const telegram = telegramBotToken && telegramChatId ? new TelegramBotProvider(telegramBotToken, telegramChatId) : null

  return { sms, email, telegram }
}

function logNotification(channel: string, to: string, success: boolean, error?: string) {
  const timestamp = new Date().toISOString()
  if (success) {
    console.log(`[${timestamp}] [Notification] ${channel} sent to ${to}`)
  } else {
    console.error(`[${timestamp}] [Notification] ${channel} failed for ${to}${error ? `: ${error}` : ""}`)
  }
}

interface BookingData {
  id: string
  datetime: Date | string
  passengers: number
  baggageType: string
  priceCalculated: number
  priceFinal?: number | null
  status: string
  notes?: string | null
  carClass?: string | null
  driverName?: string | null
  driverPhone?: string | null
  carInfo?: string | null
  route?: { fromPoint: string; toPoint: string; distanceKm?: number } | null
}

interface UserData {
  phone: string
  name?: string | null
}

interface DriverData {
  name: string
  phone: string
  carInfo: string
}

function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}

function getStatusText(status: string): string {
  const statuses: Record<string, string> = {
    pending: "Ожидает подтверждения",
    confirmed: "Подтверждена",
    in_progress: "В пути",
    completed: "Завершена",
    cancelled: "Отменена"
  }
  return statuses[status] || status
}

export async function sendBookingConfirmation(booking: BookingData, user: UserData) {
  const { sms, email, telegram } = getProviders()
  const route = booking.route
  const routeText = route ? `${route.fromPoint} → ${route.toPoint}` : "Не указан"

  const message = [
    `🚗 <b>Crimea Transfer</b>`,
    ``,
    `✅ Заявка #${booking.id.slice(-8).toUpperCase()} создана`,
    ``,
    `📍 Маршрут: ${routeText}`,
    `📅 Дата: ${formatDate(booking.datetime)}`,
    `👥 Пассажиры: ${booking.passengers}`,
    `💰 Сумма: ${booking.priceFinal || booking.priceCalculated} ₽`,
    ``,
    `Ожидайте подтверждения.`
  ].join("\n")

  const promises: Promise<boolean>[] = []

  if (sms && user.phone) {
    const smsMessage = `Crimea Transfer: Заявка #${booking.id.slice(-8).toUpperCase()} создана. Маршрут: ${routeText}. Сумма: ${booking.priceFinal || booking.priceCalculated} ₽. Ожидайте подтверждения.`
    promises.push(sms.send({ to: user.phone, message: smsMessage }).then(ok => {
      logNotification("SMS", user.phone, ok)
      return ok
    }))
  }

  if (email && user.phone) {
    promises.push(email.send({
      to: user.phone,
      subject: `Заявка #${booking.id.slice(-8).toUpperCase()} создана`,
      message: message,
      html: message.replace(/\n/g, "<br>")
    }).then(ok => {
      logNotification("Email", user.phone, ok)
      return ok
    }))
  }

  await Promise.allSettled(promises)
}

export async function sendDriverAssigned(booking: BookingData, driver: DriverData) {
  const { sms, email, telegram } = getProviders()
  const route = booking.route
  const routeText = route ? `${route.fromPoint} → ${route.toPoint}` : "Не указан"

  const message = [
    `🚗 <b>Crimea Transfer</b>`,
    ``,
    `👤 <b>Водитель назначен</b>`,
    ``,
    `📋 Заявка #${booking.id.slice(-8).toUpperCase()}`,
    `📍 Маршрут: ${routeText}`,
    `📅 Дата: ${formatDate(booking.datetime)}`,
    ``,
    `🚘 Водитель: ${driver.name}`,
    `📱 Телефон: ${driver.phone}`,
    `🚗 Авто: ${driver.carInfo}`,
    ``,
    `Ожидайте звонка от водителя.`
  ].join("\n")

  const promises: Promise<boolean>[] = []

  if (sms) {
    const smsMessage = `Crimea Transfer: Водитель ${driver.name} (${driver.phone}, ${driver.carInfo}) назначен на заявку #${booking.id.slice(-8).toUpperCase()}. Маршрут: ${routeText}. Дата: ${formatDate(booking.datetime)}.`
    promises.push(sms.send({ to: driver.phone, message: smsMessage }).then(ok => {
      logNotification("SMS", driver.phone, ok)
      return ok
    }))
  }

  if (email) {
    promises.push(email.send({
      to: driver.phone,
      subject: `Назначение на заявку #${booking.id.slice(-8).toUpperCase()}`,
      message: message,
      html: message.replace(/\n/g, "<br>")
    }).then(ok => {
      logNotification("Email", driver.phone, ok)
      return ok
    }))
  }

  if (telegram) {
    promises.push(telegram.send({
      to: process.env.TELEGRAM_CHAT_ID || "",
      message: message
    }).then(ok => {
      logNotification("Telegram", "dispatcher", ok)
      return ok
    }))
  }

  await Promise.allSettled(promises)
}

export async function sendStatusChange(booking: BookingData, newStatus: string) {
  const { sms, email, telegram } = getProviders()
  const route = booking.route
  const routeText = route ? `${route.fromPoint} → ${route.toPoint}` : "Не указан"
  const statusText = getStatusText(newStatus)

  const message = [
    `🚗 <b>Crimea Transfer</b>`,
    ``,
    `📋 Заявка #${booking.id.slice(-8).toUpperCase()}`,
    `📍 Маршрут: ${routeText}`,
    `📅 Дата: ${formatDate(booking.datetime)}`,
    ``,
    `🔄 Статус изменен: <b>${statusText}</b>`,
    ``,
    newStatus === "cancelled" && booking.notes ? `Причина: ${booking.notes}` : "",
    newStatus === "completed" ? `💰 Итого: ${booking.priceFinal || booking.priceCalculated} ₽` : ""
  ].filter(Boolean).join("\n")

  const promises: Promise<boolean>[] = []

  if (sms) {
    const smsMessage = `Crimea Transfer: Заявка #${booking.id.slice(-8).toUpperCase()} - ${statusText}.`
    promises.push(sms.send({ to: "", message: smsMessage }).then(ok => {
      logNotification("SMS", "user", ok)
      return ok
    }))
  }

  if (email) {
    promises.push(email.send({
      to: "",
      subject: `Заявка #${booking.id.slice(-8).toUpperCase()} - ${statusText}`,
      message: message,
      html: message.replace(/\n/g, "<br>")
    }).then(ok => {
      logNotification("Email", "user", ok)
      return ok
    }))
  }

  if (telegram) {
    promises.push(telegram.send({
      to: process.env.TELEGRAM_CHAT_ID || "",
      message: message
    }).then(ok => {
      logNotification("Telegram", "dispatcher", ok)
      return ok
    }))
  }

  await Promise.allSettled(promises)
}

export async function sendReminder(booking: BookingData) {
  const { sms, email, telegram } = getProviders()
  const route = booking.route
  const routeText = route ? `${route.fromPoint} → ${route.toPoint}` : "Не указан"

  const message = [
    `🚗 <b>Crimea Transfer</b>`,
    ``,
    `⏰ <b>Напоминание</b>`,
    ``,
    `📋 Заявка #${booking.id.slice(-8).toUpperCase()}`,
    `📍 Маршрут: ${routeText}`,
    `📅 Дата: ${formatDate(booking.datetime)}`,
    `👥 Пассажиры: ${booking.passengers}`,
    ``,
    booking.driverName ? `🚘 Водитель: ${booking.driverName} (${booking.driverPhone})` : "",
    ``,
    `Ждем вас!`
  ].filter(Boolean).join("\n")

  const promises: Promise<boolean>[] = []

  if (sms) {
    const smsMessage = `Crimea Transfer: Напоминание - заявка #${booking.id.slice(-8).toUpperCase()} завтра в ${formatDate(booking.datetime)}. Маршрут: ${routeText}.`
    promises.push(sms.send({ to: "", message: smsMessage }).then(ok => {
      logNotification("SMS", "user", ok)
      return ok
    }))
  }

  if (email) {
    promises.push(email.send({
      to: "",
      subject: `Напоминание: заявка #${booking.id.slice(-8).toUpperCase()}`,
      message: message,
      html: message.replace(/\n/g, "<br>")
    }).then(ok => {
      logNotification("Email", "user", ok)
      return ok
    }))
  }

  if (telegram) {
    promises.push(telegram.send({
      to: process.env.TELEGRAM_CHAT_ID || "",
      message: message
    }).then(ok => {
      logNotification("Telegram", "dispatcher", ok)
      return ok
    }))
  }

  await Promise.allSettled(promises)
}

export async function sendDispatcherNewBooking(booking: BookingData) {
  const { telegram, sms, email } = getProviders()
  const route = booking.route
  const routeText = route ? `${route.fromPoint} → ${route.toPoint}` : "Не указан"

  const message = [
    `🚗 <b>Новая заявка!</b>`,
    ``,
    `📋 #${booking.id.slice(-8).toUpperCase()}`,
    `📍 Маршрут: ${routeText}`,
    `📅 Дата: ${formatDate(booking.datetime)}`,
    `👥 Пассажиры: ${booking.passengers}`,
    `💰 Сумма: ${booking.priceFinal || booking.priceCalculated} ₽`,
    booking.notes ? `📝 Примечание: ${booking.notes}` : ""
  ].filter(Boolean).join("\n")

  const promises: Promise<boolean>[] = []

  if (telegram) {
    promises.push(telegram.send({
      to: process.env.TELEGRAM_CHAT_ID || "",
      message: message
    }).then(ok => {
      logNotification("Telegram", "dispatcher", ok)
      return ok
    }))
  }

  if (sms) {
    const smsMessage = `Crimea Transfer: Новая заявка #${booking.id.slice(-8).toUpperCase()} от ${booking.passengers} пассажиров. Маршрут: ${routeText}. Сумма: ${booking.priceFinal || booking.priceCalculated} ₽.`
    promises.push(sms.send({ to: "", message: smsMessage }).then(ok => {
      logNotification("SMS", "dispatcher", ok)
      return ok
    }))
  }

  if (email) {
    promises.push(email.send({
      to: "",
      subject: `Новая заявка #${booking.id.slice(-8).toUpperCase()}`,
      message: message,
      html: message.replace(/\n/g, "<br>")
    }).then(ok => {
      logNotification("Email", "dispatcher", ok)
      return ok
    }))
  }

  await Promise.allSettled(promises)
}

export async function sendTestNotification(type: "sms" | "email" | "telegram", recipient: string): Promise<boolean> {
  const { sms, email, telegram } = getProviders()
  const message = `🚗 Crimea Transfer: Тестовое уведомление\n\nЭто тестовое сообщение для проверки каналов уведомлений.\nВремя: ${new Date().toLocaleString("ru-RU")}`

  try {
    switch (type) {
      case "sms":
        if (!sms) {
          console.error("[Test] SMS provider not configured (SMS_API_KEY not set)")
          return false
        }
        return await sms.send({ to: recipient, message })

      case "email":
        if (!email) {
          console.error("[Test] Email provider not configured (RESEND_API_KEY not set)")
          return false
        }
        return await email.send({
          to: recipient,
          subject: "Crimea Transfer: Тестовое уведомление",
          message,
          html: message.replace(/\n/g, "<br>")
        })

      case "telegram":
        if (!telegram) {
          console.error("[Test] Telegram provider not configured (TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set)")
          return false
        }
        return await telegram.send({ to: recipient, message: message.replace(/\n/g, "<br>") })

      default:
        return false
    }
  } catch (error) {
    console.error(`[Test] Error sending ${type} notification:`, error)
    return false
  }
}
