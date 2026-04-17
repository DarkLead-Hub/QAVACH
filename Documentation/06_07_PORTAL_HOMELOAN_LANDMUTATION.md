# Home Loan & Land Mutation Portals — Build Specification

## Overview

Two PQC-enabled portals. Each uses a different claim type to show that QAVACH is generalisable beyond income proofs. Build these after the Scholarship portal — they share 90% of the same structure. Only the claim type, OPA policy, and UI chrome differ.

**Both portals run on the same Next.js template. Build one, duplicate for the other.**

---

# Portal 1: Home Loan Pre-Screening

## What This Is

A bank's home loan eligibility pre-screening portal. It checks two things simultaneously: income above ₹5L/year AND a positive CIBIL score signal. This demonstrates **composite claim verification** — a single QAVACH proof can attest to multiple conditions at once.

Port: **3002**

---

## Claim Type: `composite_income_cibil`

This is a compound claim. OPA evaluates both conditions. If either fails, the whole claim is denied.

```rego
# policies/composite_income_cibil.rego
package qavach

default allow = false

allow {
  income_sufficient
  cibil_eligible
  not credential_expired
}

income_sufficient {
  input.attributes.annual_income >= 500000
}

cibil_eligible {
  # For demo: CIBIL score embedded in income cert as a synthetic attribute
  # In production: separate CIBIL credential
  input.attributes.cibil_signal == "positive"
}

# Detailed reason for UI
reason = "Income and credit profile eligible" { allow }
reason = "Income ₹" { not allow; not income_sufficient }
reason = "Credit profile insufficient" { not allow; not cibil_eligible; income_sufficient }
```

**Demo data modification needed:**
Add `cibil_signal: "positive"` to income certificate attributes for CITIZEN_001 and CITIZEN_003 in the Mock CA. CITIZEN_002 gets `cibil_signal: "negative"` to show the denial path.

---

## Key Differences from Scholarship Portal

### QrVerifier props:
```tsx
// claim_type changes
<QrVerifier
  claimType="composite_income_cibil"
  portalId="homeloan-portal"
  label="Verify income & credit eligibility"
  instructions={[
    'Open QAVACH app',
    'Tap "Scan to Verify"',
    'Both income and credit score will be checked privately',
  ]}
/>
```

### Result screen additions:
Show two verified conditions as a checklist:
```
Income verification       ✓  Annual income above ₹5,00,000
Credit signal             ✓  Positive credit profile
Quantum safe              ✓  ML-DSA-44 (NIST FIPS 204)
Documents shared          —  None. All checks ran on your device.
```

If CITIZEN_002 (Rahul Mehta, ₹4.8L) tries — income check fails. Show:
```
Income verification       ✗  Income ₹4,80,000 below ₹5,00,000 threshold
                              Loan amount requested may need to be reduced
```

### Portal chrome:
- Header: replace government crest with bank logo (generic "IndiaBank" text)
- Colour scheme: blue (`blue-700`) instead of the government's orange

---

## Application Form Fields

```
Loan type:          [Home Loan ▾]
Loan amount:        [____________]  (₹)
Property location:  [____________]
Employment type:    [Salaried / Self-employed / Business ▾]
Applicant name:     [____________]
Mobile:             [____________]

[No income document field]
[Verify Eligibility with QAVACH →]
```

Banner above the form:
```
No documents needed.
QAVACH verifies your income and credit profile
privately in under 10 seconds.
```

---

## .env.local

```env
GOVSIGN_URL=http://localhost:8000
PORTAL_API_KEY=govsign-homeloan-dev
NEXT_PUBLIC_APP_NAME=IndiaBank — Home Loan Pre-screening
NEXT_PUBLIC_PORTAL_COLOR=blue
```

---

# Portal 2: Land Mutation Portal

## What This Is

A state revenue department portal for property mutation (transfer of land ownership records). The citizen proves they own a specific land parcel — again, without submitting any document.

Port: **3003**

This portal is notable because the underlying credential (land ownership record from REVENUE dept) is signed with **RSA-2048**, not PQC. The QAVACH app will show a **warning** in the policy check screen: "Issuer not quantum-safe." The portal shows a yellow warning banner after verification. This is intentional — it shows the system can handle mixed-mode credentials gracefully.

---

## Claim Type: `land_ownership`

```rego
# policies/land_ownership.rego
package qavach

default allow = false

allow {
  input.credential_type == "land_ownership"
  input.attributes.ownership_type == "freehold"
  not credential_expired
  input.issuer_dept_id == "REVENUE"
}

# Note: we do NOT check quantum_safe here — the portal handles that separately
# The claim is valid; the warning is a migration advisory
```

---

## Key Differences from Scholarship Portal

### QR verification note:
The `quantum_safe` field in the proof response will be `false` (because REVENUE uses RSA-2048). The portal must check this and show a warning — NOT block the verification.

```typescript
// In result processing:
if (result.quantum_safe === false) {
  // Show verification as successful but with warning
  setWarning('Revenue Department uses RSA-2048 — not quantum-safe. This credential will need to be reissued once Revenue Dept migrates to PQC.')
}
```

### Result screen — warning state:
```
Land ownership verified ✓

PARCEL: KA-BLR-001 · Bangalore Urban, Karnataka
AREA:   1,200 sq ft · Freehold

─────────────────────────────────────────
⚠  QUANTUM SAFETY WARNING
─────────────────────────────────────────
Issuer: Revenue Department
Algorithm: RSA-2048

This credential was signed with classical cryptography.
It is valid today but will not be quantum-safe when
large-scale quantum computers become available.
Contact the Revenue Department to reissue with
SLH-DSA-SHAKE-128s (NIST FIPS 205).
─────────────────────────────────────────
```

### CBOM widget (side panel):
Show a mini CBOM widget directly on the result page:
```
Department migration status:
  ✓ Income Tax Dept     PQC ready
  ✓ UIDAI               PQC ready
  ✗ Revenue Dept        Classical — migration pending
```

This is a powerful demo moment: verification succeeded, but the system is telling you there's a problem. That's exactly what good security tooling should do.

---

## Application Form Fields

```
Current owner name:       [____________]
Parcel ID:                [____________]  (e.g. KA-BLR-001)
New owner name:           [____________]
Reason for mutation:      [Sale / Inheritance / Gift ▾]
Sale deed reference:      [____________]

[Verify Ownership with QAVACH →]
```

---

## .env.local

```env
GOVSIGN_URL=http://localhost:8000
PORTAL_API_KEY=govsign-landmutation-dev
NEXT_PUBLIC_APP_NAME=Revenue Department — Land Mutation Portal
NEXT_PUBLIC_PORTAL_COLOR=orange
```

---

# Shared Portal Template

Since all PQC portals (scholarship, home loan, land mutation) share the same structure, build a base template and extend it.

## Shared Components (portals/shared/)

Create `portals/shared/` with:

```
portals/shared/
├── QrVerifier.tsx          ← exact same component, parameterised
├── SecurityBadge.tsx       ← PQC / Classical / Warning badges
├── StepIndicator.tsx
├── PortalLayout.tsx        ← header + footer shell, accepts color + title props
└── govsign.ts              ← shared GovSign API client
```

Then each portal's `package.json` adds a path alias:
```json
{
  "dependencies": {
    "@qavach/shared": "file:../shared"
  }
}
```

Or simply copy the files — for a hackathon, copy-paste is fine.

---

## Running Both Portals

```bash
# Terminal 1
cd portals/homeloan && npm install && npm run dev -- --port 3002

# Terminal 2
cd portals/land-mutation && npm install && npm run dev -- --port 3003
```

---

## Demo Script Differences

### Home Loan (Rahul Mehta — will be denied):
1. Fill form: "Rahul Mehta, Loan: ₹40L"
2. Scan QR with QAVACH as Rahul (Aadhaar: 222233334444)
3. App shows: "Income ₹4,80,000 — below ₹5,00,000 threshold — DENIED"
4. Portal shows red screen. Say: "Same privacy guarantees — Rahul's income never left his phone. He just didn't qualify."

### Land Mutation (Priya Sharma — succeeds with warning):
1. Fill form: Parcel KA-BLR-001
2. Scan QR with QAVACH as Priya
3. App shows orange warning: "Revenue Dept uses RSA-2048 — classical crypto"
4. Portal shows verified + yellow warning banner
5. Point to warning: "The verification worked — but the system is telling us the Revenue Department hasn't migrated yet. That's visible on the CBOM dashboard."
