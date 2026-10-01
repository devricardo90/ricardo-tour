import { NextResponse } from 'next/server'
import { getPublicTrips } from '@/lib/catalog/public-trips'

// Revalidar a cada 60 segundos
export const revalidate = 60

// RT-57: this public endpoint is gated by the same catalog rule as the Home, /tours and tour detail (RT-53). It
// previously returned every `isPublished` row, which leaked records outside the approved launch catalog. The only
// former consumer (the legacy Home search box) is retired; the Admin does not read this endpoint (it only
// revalidates its path), so Admin behavior is unaffected. No third visibility rule is introduced here.
export async function GET() {
    try {
        const trips = await getPublicTrips()

        return NextResponse.json(
            trips.map(({ id, title, description, city, location }) => ({ id, title, description, city, location })),
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
                },
            }
        )
    } catch (error) {
        console.error('Error fetching trips:', error)
        return NextResponse.json(
            { error: 'Failed to fetch trips' },
            { status: 500 }
        )
    }
}
