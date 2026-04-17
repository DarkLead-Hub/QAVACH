'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import PortalLayout from '../../../shared/PortalLayout'
import QrVerifier from '../../../shared/QrVerifier'

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const name = searchParams.get('name')
  const course = searchParams.get('course')

  const handleVerified = (result: any) => {
    const params = new URLSearchParams({
      name: name || '',
      course: course || '',
      verified: 'true',
      algorithm: result.algorithm,
      issuer: result.issuer,
      timestamp: result.verified_at
    })
    router.push(`/result?${params.toString()}`)
  }

  const handleDenied = (reason: string) => {
    const params = new URLSearchParams({
      name: name || '',
      verified: 'false',
      reason: reason
    })
    router.push(`/result?${params.toString()}`)
  }

  return (
    <PortalLayout title="Income Verification">
      <div className="py-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Scan to Verify</h2>
          <p className="text-gray-500 mt-1">Proving eligibility for applicant: <span className="font-bold text-gray-900">{name}</span></p>
        </div>

        <QrVerifier 
          claimType="income_lt_3L" 
          portalId="scholarship-portal"
          label="Verify Annual Income < ₹3,00,000"
          onVerified={handleVerified}
          onDenied={handleDenied}
        />

        <div className="mt-12 max-w-sm mx-auto bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-[10px] text-amber-800 leading-tight">
            <span className="font-bold">Important:</span> This process uses Policy-Gated Credential Attestation. The portal only receives a "True/False" result signed by your phone. Your original income document never leaves your device.
          </p>
        </div>
      </div>
    </PortalLayout>
  )
}
