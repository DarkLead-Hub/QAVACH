# Legacy Portals — Ration Card & Trade Licence

## What These Are

Two deliberately classical (non-PQC) portals. They exist to prove the migration gap is real and visible. Both portals use RSA-2048 or ECDSA for document verification and show warning banners prominently. The QAVACH app still works with them — but marks every interaction as "not quantum-safe."

These portals represent the majority of India's current e-governance landscape. Showing them alongside the PQC portals makes the contrast undeniable.

**Build these last. They are simpler than the PQC portals — no GovSign sessions, no QR-based PGCA. They use a basic document upload + classical signature verification flow.**

Port: Ration Card **3004**, Trade Licence **3005**

---

## Design Philosophy

Every page of these portals has a persistent banner:

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⚠  This portal uses classical cryptography (RSA-2048).             │
│     It is not protected against quantum computing attacks.           │
│     View migration status on the CBOM dashboard →                   │
└─────────────────────────────────────────────────────────────────────┘
```

This is NOT an error. The portals work. The banner is a migration advisory — exactly what a responsible government system should show.

---

# Portal 1: Ration Card Portal (PDS)

Port: **3004**

## What It Demonstrates

A Public Distribution System (ration card) portal that asks users to upload an income certificate PDF for eligibility verification. Classical RSA-2048 signature check on the PDF. Compare directly to the Scholarship portal — same use case, opposite security posture.

---

## Tech Stack

- Next.js 14, Tailwind CSS
- `pdf.js` for PDF parsing (extract embedded signature)
- `node-forge` or `crypto` for RSA signature verification
- No GovSign sessions — this portal verifies directly via GovSign `/verify` endpoint

---

## Project Structure

```
portals/ration-card/
├── app/
│   ├── layout.tsx          ← includes persistent warning banner
│   ├── page.tsx            ← landing
│   ├── apply/page.tsx      ← application form with upload
│   ├── verify/page.tsx     ← signature verification result
│   └── api/
│       └── verify-doc/route.ts   ← calls GovSign /verify
├── components/
│   ├── ClassicalWarningBanner.tsx
│   ├── DocumentUploader.tsx
│   └── VerificationResult.tsx
```

---

## Warning Banner Component

```tsx
// components/ClassicalWarningBanner.tsx
'use client'
import Link from 'next/link'

export function ClassicalWarningBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-start gap-3">
        <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-800">
            This portal uses classical cryptography (RSA-2048) — not quantum-safe
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            Documents submitted here are signed with RSA-2048, which is vulnerable to future quantum computing attacks.
            {' '}
            <Link
              href="http://localhost:5173"
              className="underline hover:no-underline"
              target="_blank"
            >
              View CBOM dashboard →
            </Link>
          </p>
        </div>
        <div className="flex-shrink-0">
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-1 rounded-full border border-amber-300">
            RSA-2048
          </span>
        </div>
      </div>
    </div>
  )
}
```

---

## Application Form

```tsx
// app/apply/page.tsx
// Fields:
// - Head of household name
// - State + District + Block
// - Number of family members
// - Monthly income (typed number — no verification, just stored)
// - Income certificate upload (PDF)
//   → accepted, extracted hash, verified against GovSign using RSA classical path
// - Aadhaar card copy upload (image)
// - Submit button

// Note: User is UPLOADING their income certificate. Compare to scholarship portal
// where they never upload anything. This contrast is the demo's entire point.
```

Add this note below the income certificate upload field:
```tsx
<p className="text-xs text-gray-400 mt-1">
  Compare this to QAVACH-enabled portals, where you never need to upload documents.
  Your certificate is verified privately on your phone.
</p>
```

---

## Document Verification Flow

When a PDF is uploaded:

1. Extract the document hash from the PDF metadata
2. Call GovSign `/verify` with the hash and a known dept signature (use REVENUE dept which is RSA)
3. Display the result with explicit "NOT QUANTUM SAFE" label

```typescript
// app/api/verify-doc/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  // body: { doc_hash, sig_id, dept_id, signature_b64 }
  
  const res = await fetch(`${process.env.GOVSIGN_URL}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.PORTAL_API_KEY!,
    },
    body: JSON.stringify(body),
  })
  
  const data = await res.json()
  // data.quantum_safe will be false for RSA-2048
  // data.algorithm will be "RSA-2048"
  
  return NextResponse.json(data)
}
```

---

## Verification Result Display

```tsx
// components/VerificationResult.tsx
// Shows the result with an explicit comparison to PQC

// If quantum_safe === false:
<div className="border border-amber-200 rounded-xl p-6 bg-amber-50">
  <div className="flex items-center gap-2 mb-4">
    <CheckIcon className="w-5 h-5 text-green-600" />
    <span className="font-medium">Document verified</span>
    <span className="ml-auto text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300">
      NOT quantum-safe
    </span>
  </div>
  
  <div className="space-y-2 text-sm">
    <Row label="Issuer" value="Revenue Department" />
    <Row label="Algorithm" value="RSA-2048" />
    <Row label="Quantum safe" value="No ✗" valueClass="text-amber-700" />
    <Row label="Document shared" value="YES — income certificate uploaded to server" valueClass="text-red-600" />
  </div>
  
  <div className="mt-4 pt-4 border-t border-amber-200 text-xs text-amber-700">
    Compare: QAVACH-enabled portals verify the same claim without you uploading anything.
  </div>
</div>
```

---

# Portal 2: Trade Licence Portal

Port: **3005**

## What It Demonstrates

A municipal corporation portal for trade licence renewal. Uses ECDSA P-256 — slightly more modern than RSA but still classical. Shows that "not all classical crypto is equally bad" but none of it is quantum-safe.

---

## Differences from Ration Card Portal

1. Algorithm in banner: `ECDSA P-256` instead of `RSA-2048`
2. Verification calls GovSign with MUNICIPAL dept (which uses ECDSA-P256)
3. Form fields are business-related:
   - Business name
   - Proprietor name
   - Business type (dropdown)
   - Existing licence number
   - GST certificate upload (classical signature verification)
4. Warning banner text: "This portal uses ECDSA P-256 — not quantum-safe"

---

## Shared Warning Banner Parametrisation

Both legacy portals use the same warning banner component, parametrised:

```tsx
<ClassicalWarningBanner
  algorithm="ECDSA P-256"
  deptName="Municipal Corporation"
  risk="high"
/>
```

---

## Running Both Legacy Portals

```bash
cd portals/ration-card
npm install && npm run dev -- --port 3004

cd portals/trade-licence
npm install && npm run dev -- --port 3005
```

---

## The Full 5-Portal Demo Setup

Once all portals are running, open these tabs in the browser for the judge walkthrough:

| Tab | URL | Algorithm | Status |
|---|---|---|---|
| Scholarship | localhost:3001 | ML-DSA-44 | ✓ PQC |
| Home Loan | localhost:3002 | ML-DSA-44 | ✓ PQC |
| Land Mutation | localhost:3003 | RSA-2048 | ⚠ Classical (warning) |
| Ration Card | localhost:3004 | RSA-2048 | ✗ Classical |
| Trade Licence | localhost:3005 | ECDSA P-256 | ✗ Classical |
| CBOM Dashboard | localhost:5173 | — | Admin view |

The CBOM dashboard shows all five portals' backing departments and their migration status in real time. This is the "command centre" view.

---

## Demo Script for Legacy Portals

### Ration Card (contrast demo):
1. Open ration card portal: "Look at this — a standard government portal"
2. Point to the upload field: "To apply for a ration card, you have to upload your income certificate. It goes to a server. It gets stored somewhere."
3. Point to the warning banner: "Our system is being honest about the security posture — RSA-2048, not quantum-safe"
4. Switch to scholarship portal tab: "Same eligibility requirement — income below ₹3L. But here, you scan a QR. The document never leaves the phone."

### The killer comparison line:
"Both portals verified the same claim. One stored your income certificate on a government server. The other didn't receive a single byte of your personal data. That's what post-quantum selective disclosure looks like at scale."
