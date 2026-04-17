import { NextRequest, NextResponse } from 'next/server'

const GOVSIGN = process.env.GOVSIGN_URL || 'http://localhost:8000'
const API_KEY = process.env.PORTAL_API_KEY || 'govsign-scholarship-dev'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const res = await fetch(`${GOVSIGN}/sessions/${id}`, {
      headers: { 'X-API-Key': API_KEY },
      cache: 'no-store',
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 })
  }
}
