import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const phone = searchParams.get("phone")
    const since = searchParams.get("since")

    if (!phone || !since) {
      return NextResponse.json({ verified: false })
    }

    const apiKey = process.env.ONLINEPBX_API_KEY
    const callbackPhone = process.env.CALLBACK_PHONE
    const sipDomain = process.env.ONLINEPBX_SIP_DOMAIN
    const email = "vl.dut.crimea@gmail.com"

    if (!apiKey || !callbackPhone || !sipDomain) {
      console.error("? OnlinePBX не настроен")
      return NextResponse.json({ verified: false, error: "Not configured" })
    }

    const apiUrl = `https://api2.onlinepbx.ru/${sipDomain}/mongo_history/search.json`
    
    const sinceTimestamp = Math.floor(new Date(since).getTime() / 1000)
    const nowTimestamp = Math.floor(Date.now() / 1000)

    const formData = new URLSearchParams()
    formData.append("phone_numbers", phone.replace(/\D/g, "").replace(/^8/, "7"))
    formData.append("start_stamp_from", sinceTimestamp.toString())
    formData.append("start_stamp_to", nowTimestamp.toString())
    formData.append("accountcode", "inbound")

    console.log("?? Запрос к OnlinePBX:", apiUrl)

    // Пробуем несколько методов
    const methods = [
      // Метод 1: Basic Auth с email:api_key
      {
        name: "Basic Auth (email:apiKey)",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${Buffer.from(`${email}:${apiKey}`).toString('base64')}`
        }
      },
      // Метод 2: apiKey в query string
      {
        name: "Query param apiKey",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        url: `${apiUrl}?apiKey=${apiKey}`
      },
      // Метод 3: api_key в query string
      {
        name: "Query param api_key",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        url: `${apiUrl}?api_key=${apiKey}`
      }
    ]

    for (const method of methods) {
      console.log(`?? Пробуем: ${method.name}`)
      
      const url = method.url || apiUrl
      const response = await fetch(url, {
        method: "POST",
        headers: method.headers,
        body: formData.toString()
      })

      const responseText = await response.text()
      console.log(`?? Ответ (${response.status}):`, responseText.slice(0, 300))

      if (response.ok && !responseText.includes("not authorized")) {
        console.log(`? Метод сработал: ${method.name}`)
        
        try {
          const data = JSON.parse(responseText)
          const calls = data.data || data.result || data.calls || []
          const callerPhone = phone.replace(/\D/g, "").replace(/^8/, "7")

          const foundCall = calls.find((call: any) => {
            const callSrc = (call.caller_id_number || call.src || call.from || "").replace(/\D/g, "").replace(/^8/, "7")
            return callSrc === callerPhone
          })

          if (foundCall) {
            console.log("? Найден звонок от", phone)
            const code = Math.floor(1000 + Math.random() * 9000).toString()
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

            await prisma.otpCode.create({
              data: { phone, code, expiresAt, isUsed: false }
            })

            return NextResponse.json({ verified: true, code })
          }

          return NextResponse.json({ verified: false })
        } catch (parseError) {
          console.error("? Ошибка парсинга:", responseText)
        }
      }
    }

    return NextResponse.json({ verified: false, error: "Auth failed" })
  } catch (error) {
    console.error("Check calls error:", error)
    return NextResponse.json({ verified: false, error: String(error) })
  }
}

