import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../lib/auth"
import { prisma } from "../../../lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "РќРµРѕР±С…РѕРґРёРјР° Р°РІС‚РѕСЂРёР·Р°С†РёСЏ" },
        { status: 401 }
      )
    }

    const data = await req.json()

    // РќР°С…РѕРґРёРј РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РІ Р‘Р”
    const user = await prisma.user.findUnique({
      where: { phone: session.user.phone as string }
    })

    if (!user) {
      return NextResponse.json(
        { error: "РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ РЅРµ РЅР°Р№РґРµРЅ" },
        { status: 404 }
      )
    }

    // РЎРѕР·РґР°С‘Рј Р±СЂРѕРЅСЊ
    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        routeId: data.routeId,
        datetime: new Date(data.datetime),
        passengers: data.passengers,
        baggageType: data.baggageType,
        priceCalculated: data.priceCalculated,
        status: "pending"
      }
    })

    // Р’ СЂРµР¶РёРјРµ СЂР°Р·СЂР°Р±РѕС‚РєРё РІС‹РІРѕРґРёРј РєРѕРґ РІ РєРѕРЅСЃРѕР»СЊ
    console.log(`вњ… Р—Р°СЏРІРєР° в„–${booking.id.slice(-6)} СЃРѕР·РґР°РЅР°`)
    console.log(`   РњР°СЂС€СЂСѓС‚: ${data.routeId}`)
    console.log(`   Р”Р°С‚Р°: ${data.datetime}`)
    console.log(`   РџР°СЃСЃР°Р¶РёСЂС‹: ${data.passengers}`)
    console.log(`   Р‘Р°РіР°Р¶: ${data.baggageType}`)
    console.log(`   Р¦РµРЅР°: ${data.priceCalculated} в‚Ѕ`)

    // Р—РґРµСЃСЊ РїРѕР·Р¶Рµ Р±СѓРґРµС‚ РѕС‚РїСЂР°РІРєР° SMS Рё MAX
    // await sendSms(user.phone, `Р—Р°СЏРІРєР° в„–${booking.id.slice(-6)} РїСЂРёРЅСЏС‚Р°`)
    // await sendMax(user.phone, booking)

    return NextResponse.json({
      success: true,
      bookingId: booking.id.slice(-6)
    })
  } catch (error) {
    console.error("Booking error:", error)
    return NextResponse.json(
      { error: "РћС€РёР±РєР° СЃРµСЂРІРµСЂР°" },
      { status: 500 }
    )
  }
}

