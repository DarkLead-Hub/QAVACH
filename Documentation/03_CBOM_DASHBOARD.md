# CBOM Dashboard — Complete Build Specification

## What This Is

The Cryptography Bill of Materials (CBOM) Dashboard is a React web application that visualises which government departments have migrated to post-quantum cryptography and which are still at risk. It reads live data from the GovSign API and displays department compliance status, recent signing activity, and risk scores.

This is shown to hackathon judges as the "command centre" — the tool a government CISO would use to track the PQC migration programme. It makes the migration problem visible and quantified.

**Build after GovSign (Step 1) is running. Depends on `GET /cbom` and `GET /departments`.**

---

## Tech Stack

- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS v3
- **Data fetching:** React Query (TanStack Query v5)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Port:** 5173 (dev), 3003 (prod)

---

## Project Structure

```
dashboard/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── config.ts                  ← API base URL
│   ├── api/
│   │   ├── govsign.ts             ← typed fetch wrappers for GovSign API
│   │   └── types.ts               ← TypeScript types matching GovSign schemas
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── TopBar.tsx
│   │   ├── cbom/
│   │   │   ├── SummaryCards.tsx   ← 4 stat cards (PQC / Hybrid / Classical / Pending)
│   │   │   ├── DeptTable.tsx      ← filterable department table
│   │   │   ├── RiskBadge.tsx      ← Low / Medium / High risk pill
│   │   │   ├── AlgoBadge.tsx      ← algorithm pill with PQC/classical indicator
│   │   │   └── ActivityFeed.tsx   ← live CBOM entry stream
│   │   ├── charts/
│   │   │   ├── CompliancePie.tsx  ← donut chart: PQC vs Hybrid vs Classical
│   │   │   └── ActivityBar.tsx    ← 7-day signing volume bar chart
│   │   └── common/
│   │       ├── StatusDot.tsx
│   │       └── RefreshIndicator.tsx
│   └── pages/
│       ├── Overview.tsx           ← main dashboard page
│       └── DeptDetail.tsx         ← drilldown for one department
```

---

## TypeScript Types

```typescript
// src/api/types.ts

export type QuantumStatus = 'pqc' | 'hybrid' | 'classical' | 'pending'
export type RiskLevel = 'low' | 'medium' | 'high' | null

export interface Department {
  dept_id: string
  name: string
  algorithm: string
  usage: string
  quantum_status: QuantumStatus
  quantum_risk: RiskLevel
  sign_count_30d: number
  last_sign_at: string | null
}

export interface CbomEntry {
  id: string
  dept_id: string
  dept_name: string
  algorithm: string
  doc_type: string
  operation: 'sign' | 'verify'
  quantum_safe: boolean
  timestamp: string
}

export interface CbomSummary {
  total: number
  pqc: number
  hybrid: number
  classical: number
  pending: number
}

export interface CbomResponse {
  summary: CbomSummary
  departments: Department[]
  recent_entries: CbomEntry[]
}
```

---

## API Layer

```typescript
// src/api/govsign.ts
import { CbomResponse } from './types'

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
```

---

## Component Specifications

### SummaryCards.tsx

Four cards in a row. Each shows a large number and a label. Color-coded:
- PQC: green text (`text-green-600`)
- Hybrid: amber (`text-amber-500`)
- Classical: red (`text-red-600`)
- Pending: gray (`text-gray-500`)

Each card is clickable and filters the department table below.

```tsx
// Props
interface Props {
  summary: CbomSummary
  activeFilter: QuantumStatus | 'all'
  onFilterChange: (f: QuantumStatus | 'all') => void
}
```

### DeptTable.tsx

Columns: Department Name | Algorithm | Usage | Status | Quantum Risk

- **Algorithm column:** Show algorithm name in a monospace pill. If quantum_safe, pill is green-tinted. If classical, pill is red-tinted.
- **Status column:** Badge. `pqc` = green "PQC ready". `hybrid` = amber "Hybrid". `classical` = red dashed border "Classical". `pending` = gray "Pending".
- **Quantum Risk column:** Horizontal progress bar. Low = 25% green. Medium = 58% amber. High = 90% red. Null = dash.
- **Row click:** Navigate to `/dept/${dept_id}` for drilldown.
- **Search:** Text filter on department name (client-side, no API call).

### CompliancePie.tsx

Recharts `PieChart` with `innerRadius` (donut style). Segments: PQC (green `#16a34a`), Hybrid (amber `#d97706`), Classical (red `#dc2626`), Pending (gray `#9ca3af`). Show percentage labels inside segments if segment > 10%. Legend below.

### ActivityFeed.tsx

A scrollable list of the 20 most recent `CbomEntry` items. Each row:
```
[timestamp] [dept_name] — [doc_type] — [algorithm] [PQC/Classical badge]
```
Color the left border of each row: green if `quantum_safe`, red if not.

Auto-refreshes every 5 seconds using React Query's `refetchInterval: 5000`.

---

## Overview.tsx — Full Page Layout

```tsx
// pages/Overview.tsx
import { useQuery } from '@tanstack/react-query'
import { fetchCbom } from '../api/govsign'
import { useState } from 'react'

export default function Overview() {
  const [filter, setFilter] = useState<string>('all')
  
  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['cbom', filter],
    queryFn: () => fetchCbom(filter === 'all' ? undefined : filter),
    refetchInterval: 10_000,
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-gray-900">CBOM — Cryptography bill of materials</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            GovSign API · department PQC compliance registry
          </p>
        </div>
        <RefreshIndicator lastUpdated={dataUpdatedAt} />
      </div>

      {/* Summary cards + pie chart side by side */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <SummaryCards
            summary={data?.summary}
            activeFilter={filter}
            onFilterChange={setFilter}
          />
        </div>
        <CompliancePie summary={data?.summary} />
      </div>

      {/* Department table */}
      <DeptTable departments={data?.departments ?? []} isLoading={isLoading} />

      {/* Activity feed */}
      <div className="grid grid-cols-2 gap-4">
        <ActivityFeed entries={data?.recent_entries ?? []} />
        <ActivityBar entries={data?.recent_entries ?? []} />
      </div>
    </div>
  )
}
```

---

## DeptDetail.tsx

When a judge clicks a department row, show:
- Full department info card
- Algorithm details: full NIST name, parameter set, signature size, key size
- Public key (truncated, with copy button)
- Timeline: all CBOM entries for this department (paginated, 20 per page)
- Migration status badge with a migration CTA (purely visual for demo)

---

## Environment Variables

Create `dashboard/.env`:
```env
VITE_GOVSIGN_URL=http://localhost:8000
VITE_GOVSIGN_ADMIN_KEY=dev-admin-key-change-in-prod
```

---

## Running the Dashboard

```bash
cd dashboard
npm install
npm run dev
# → http://localhost:5173
```

---

## What to Show Judges

1. Open the dashboard. Point to the 3 green / 2 amber / 5 red stat cards.
2. Click "Classical" filter. Five departments turn red. Say: "These departments are issuing documents right now that a quantum computer will be able to forge in the future."
3. Click on "Revenue Dept". Show their algorithm: RSA-2048. Show the migration status: "Not started."
4. Switch to the Activity Feed. If the demo is running, show live entries appearing as citizens get credentials verified.
5. Say: "This is your CBOM — your cryptographic inventory. You cannot migrate what you haven't inventoried."
