# Scholarship Portal — Complete Build Specification

## What This Is

The PM Scholarship Portal is the primary demo portal for QAVACH. It is a government scholarship application portal that requires applicants to prove their annual income is below ₹3,00,000 — without submitting any income document. Verification happens in under 10 seconds via a QR scan on the QAVACH app.

This is the "hero demo." Show this portal first. It is the cleanest illustration of the entire system.

**Depends on: GovSign (Step 1) running. QAVACH app (Step 4) installed on phone.**

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS v3
- **QR Generation:** `qrcode.react`
- **Icons:** Lucide React
- **HTTP:** native `fetch`
- **Port:** 3001

---

## Project Structure

```
portals/scholarship/
├── package.json
├── next.config.js
├── tailwind.config.ts
├── .env.local
├── app/
│   ├── layout.tsx              ← govt portal chrome (header, footer)
│   ├── page.tsx                ← landing / application form
│   ├── apply/
│   │   └── page.tsx            ← Step 1: fill form
│   ├── verify/
│   │   └── page.tsx            ← Step 2: QR scan + polling
│   ├── result/
│   │   └── page.tsx            ← Step 3: success or denied
│   └── api/
│       ├── session/
│       │   └── route.ts        ← POST: creates GovSign session
│       └── session/[id]/
│           └── route.ts        ← GET: polls GovSign session status
├── components/
│   ├── PortalHeader.tsx        ← government portal header with Ashoka emblem
│   ├── QrVerifier.tsx          ← QR display + polling + status animation
│   ├── SecurityBadge.tsx       ← "PQC Verified" green badge
│   └── StepIndicator.tsx       ← 3-step progress bar
└── lib/
    └── govsign.ts              ← GovSign API client
```

---

## Application Form (Step 1)

The form collects basic applicant info (name, course, institution). It does NOT ask for income proof. That is the point.

```tsx
// app/apply/page.tsx
// Fields:
// - Full Name (text)
// - Date of Birth (date)
// - Aadhaar last 4 digits (for reference only — not verified here)
// - Course Name (text)
// - Institution Name (text)
// - State (dropdown — Indian states)
// - Apply button → redirects to /verify?name=...&course=...
// No income field. No upload button. That is intentional and is the demo's point.
```

At the bottom of the form, add this notice box:
```
Income verification is done privately using QAVACH.
You will never need to upload an income certificate.
Your documents stay on your phone.
```

---

## QR Verifier Component (Step 2 — Core Component)

This is the most important component in the entire portal layer. It:
1. Calls `/api/session` to create a GovSign PGCA session
2. Renders the session as a QR code
3. Polls `/api/session/{id}` every 2 seconds
4. Animates through pending → scanning → verified/denied states

```tsx
// components/QrVerifier.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import QRCode from 'qrcode.react'

type VerifyStatus = 'loading' | 'ready' | 'scanned' | 'verified' | 'denied' | 'expired' | 'error'

interface Props {
  onVerified: (result: VerificationResult) => void
  onDenied: (reason: string) => void
}

interface VerificationResult {
  sessionId: string
  claimType: string
  claimValue: boolean
  verifiedAt: string
  algorithm: string
  quantumSafe: boolean
  issuer: string
}

export default function QrVerifier({ onVerified, onDenied }: Props) {
  const [status, setStatus] = useState<VerifyStatus>('loading')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [qrPayload, setQrPayload] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(300) // 5 min TTL

  // Create session on mount
  useEffect(() => {
    async function createSession() {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim_type: 'income_lt_3L', portal_id: 'scholarship-portal' }),
      })
      const data = await res.json()
      setSessionId(data.session_id)
      setQrPayload(JSON.stringify(data.qr_payload))
      setStatus('ready')
    }
    createSession()
  }, [])

  // Poll for session result
  useEffect(() => {
    if (!sessionId || status !== 'ready') return
    const interval = setInterval(async () => {
      const res = await fetch(`/api/session/${sessionId}`)
      const data = await res.json()
      
      if (data.status === 'verified') {
        setStatus('verified')
        clearInterval(interval)
        onVerified(data.result)
      } else if (data.status === 'denied') {
        setStatus('denied')
        clearInterval(interval)
        onDenied('Policy check failed on device')
      } else if (data.status === 'expired') {
        setStatus('expired')
        clearInterval(interval)
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [sessionId, status])

  // Countdown timer
  useEffect(() => {
    if (status !== 'ready') return
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000)
    return () => clearInterval(timer)
  }, [status])

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      {/* Status header */}
      <div className="text-center">
        <h2 className="text-lg font-medium text-gray-900">Verify income with QAVACH</h2>
        <p className="text-sm text-gray-500 mt-1">
          Scan with your QAVACH app to prove income eligibility
        </p>
      </div>

      {/* QR code or status indicator */}
      {status === 'loading' && (
        <div className="w-56 h-56 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
          <span className="text-sm text-gray-400">Generating...</span>
        </div>
      )}

      {status === 'ready' && qrPayload && (
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <QRCode value={qrPayload} size={200} level="M" />
        </div>
      )}

      {status === 'verified' && (
        <div className="w-56 h-56 bg-green-50 rounded-xl border-2 border-green-500 flex flex-col items-center justify-center gap-2">
          <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-700 font-medium">Verified</span>
        </div>
      )}

      {status === 'denied' && (
        <div className="w-56 h-56 bg-red-50 rounded-xl border-2 border-red-400 flex flex-col items-center justify-center gap-2">
          <svg className="w-16 h-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="text-red-600 font-medium">Not eligible</span>
        </div>
      )}

      {/* Status text */}
      {status === 'ready' && (
        <p className="text-xs text-gray-400">Expires in {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</p>
      )}

      {/* Instructions */}
      {status === 'ready' && (
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          <li>Open QAVACH app on your phone</li>
          <li>Tap "Scan to Verify"</li>
          <li>Point camera at this QR code</li>
        </ol>
      )}

      {/* Security info */}
      <div className="flex items-center gap-2 text-xs text-gray-400 border border-gray-100 rounded-lg px-3 py-2">
        <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        <span>Verified with ML-DSA-44 (NIST FIPS 204) · Your income document stays on your phone</span>
      </div>
    </div>
  )
}
```

---

## API Routes

### POST /api/session

```typescript
// app/api/session/route.ts
import { NextRequest, NextResponse } from 'next/server'

const GOVSIGN = process.env.GOVSIGN_URL!
const API_KEY = process.env.PORTAL_API_KEY!

export async function POST(req: NextRequest) {
  const body = await req.json()
  
  const res = await fetch(`${GOVSIGN}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
    body: JSON.stringify({
      claim_type: body.claim_type,     // 'income_lt_3L'
      portal_id: 'scholarship-portal',
      ttl_seconds: 300,
    }),
  })
  
  const data = await res.json()
  return NextResponse.json(data)
}
```

### GET /api/session/[id]

```typescript
// app/api/session/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'

const GOVSIGN = process.env.GOVSIGN_URL!
const API_KEY = process.env.PORTAL_API_KEY!

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const res = await fetch(`${GOVSIGN}/sessions/${params.id}`, {
    headers: { 'X-API-Key': API_KEY },
    cache: 'no-store',
  })
  const data = await res.json()
  return NextResponse.json(data)
}
```

---

## Result Page (Step 3)

```tsx
// app/result/page.tsx
// Reads search params: ?session_id=...&verified=true&algorithm=ML-DSA-44&issuer=ITD

// If verified=true:
// Show green success screen with:
// - "Application Submitted — Income Verified"
// - Applicant name + course
// - Verification details card:
//   Algorithm: ML-DSA-44 (NIST FIPS 204)
//   Issuer: Income Tax Department
//   Quantum Safe: YES ✓
//   Verified at: [timestamp]
//   Document shared: NONE — your income certificate stayed on your device
// - Next steps (mocked): "Application ID: PMSS-2024-XXXXX — You will receive SMS confirmation"

// If verified=false:
// Show red denied screen with reason
```

---

## SecurityBadge Component

Shown on the result page and in the portal header when PQC verification was used:

```tsx
// components/SecurityBadge.tsx
export function PqcSecurityBadge({ algorithm }: { algorithm: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 text-xs font-medium">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      PQC Verified · {algorithm}
    </div>
  )
}
```

---

## .env.local

```env
GOVSIGN_URL=http://localhost:8000
PORTAL_API_KEY=govsign-scholarship-dev
NEXT_PUBLIC_APP_NAME=PM Scholarship Portal
```

---

## Running the Portal

```bash
cd portals/scholarship
npm install
npm run dev
# → http://localhost:3001
```

---

## Demo Script for This Portal

1. Open `http://localhost:3001` in browser
2. Click "Apply Now"
3. Fill form: Name = "Priya Sharma", Course = "B.Tech Computer Science", Institution = "IIT Bangalore"
4. Note there is NO income upload field. Say: "In a classical portal, you'd upload a PDF here."
5. Click "Verify Income with QAVACH" → QR appears
6. Open QAVACH app → tap scan → point at QR
7. Show phone screen — policy check animation running
8. Phone shows: "Income ₹2,10,000 — ELIGIBLE"
9. Browser shows green verification success
10. Point to the "Document shared: NONE" line in the result
