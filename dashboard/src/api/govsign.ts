import type { CbomResponse } from './types'

const BASE = import.meta.env.VITE_GOVSIGN_URL ?? 'http://localhost:8000'
const ADMIN_KEY = import.meta.env.VITE_GOVSIGN_ADMIN_KEY ?? 'dev-admin-key-change-in-prod'

const headers = {
  'X-API-Key': ADMIN_KEY,
  'Content-Type': 'application/json',
}

export async function fetchCbom(status?: string): Promise<CbomResponse> {
  const url = status ? `${BASE}/cbom?status=${status}` : `${BASE}/cbom`
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`GovSign error: ${res.status}`)
  return res.json()
}

export async function fetchDeptDetail(deptId: string) {
  const res = await fetch(`${BASE}/pubkeys/${deptId}`, { headers })
  if (!res.ok) throw new Error(`Dept not found: ${deptId}`)
  return res.json()
}
