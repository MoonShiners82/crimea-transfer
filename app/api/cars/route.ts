import { NextResponse } from "next/server"
import carsData from "@/public/data/cars.json"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get("q")?.toLowerCase() || ""

  if (!search) {
    const makes = carsData.map(c => c.make)
    return NextResponse.json({ makes, models: [] })
  }

  const matchedMake = carsData.find(c => c.make.toLowerCase().includes(search))
  if (matchedMake) {
    return NextResponse.json({ makes: [matchedMake.make], models: matchedMake.models })
  }

  const allModels: { make: string; model: string }[] = []
  for (const c of carsData) {
    for (const m of c.models) {
      if (m.toLowerCase().includes(search) || c.make.toLowerCase().includes(search)) {
        allModels.push({ make: c.make, model: m })
      }
    }
  }

  return NextResponse.json({ makes: carsData.map(c => c.make), models: allModels.slice(0, 50) })
}
