import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Maps not configured' })
  }

  try {
    const query = lat && lng ? `${q} near ${lat},${lng}` : q
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
    url.searchParams.set('query', query)
    url.searchParams.set('type', 'health')
    url.searchParams.set('key', apiKey)

    const res = await fetch(url.toString())
    if (!res.ok) {
      return NextResponse.json({ error: 'Maps request failed' })
    }

    const data = await res.json()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const places = (data.results ?? []).slice(0, 10).map((p: any) => ({
      name: p.name as string,
      address: (p.formatted_address ?? '') as string,
      rating: (p.rating ?? null) as number | null,
      user_ratings_total: (p.user_ratings_total ?? null) as number | null,
      formatted_phone_number: (p.formatted_phone_number ?? null) as string | null,
    }))

    return NextResponse.json({ places })
  } catch {
    return NextResponse.json({ error: 'Maps request failed' })
  }
}
