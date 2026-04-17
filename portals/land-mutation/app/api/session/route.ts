import { NextRequest, NextResponse } from 'next/server'

const GOVSIGN = process.env.GOVSIGN_URL || 'http://localhost:8000'
const API_KEY = process.env.PORTAL_API_KEY || 'govsign-revenue-dev'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const res = await fetch(`${GOVSIGN}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
      body: JSON.stringify({
        claim_type: body.claim_type,
        portal_id: 'land-mutation-portal',
        ttl_seconds: 300,
      }),
    })

    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
