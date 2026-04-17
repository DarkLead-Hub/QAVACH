'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import PortalLayout from '../../../shared/PortalLayout'
import StepIndicator from '../../../shared/StepIndicator'
import QrVerifier from '../../../shared/QrVerifier'

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const name = searchParams.get('name')
  const amount = searchParams.get('amount')

  const handleVerified = (result: any) => {
    const params = new URLSearchParams({
      verified: 'true',
      name: name || '',
      amount: amount || '',
      algorithm: result.algorithm,
      issuer: result.issuer,
    })
    router.push(`/result?${params.toString()}`)
  }

  const handleDenied = (reason: string) => {
    router.push(`/result?verified=false&reason=${encodeURIComponent(reason)}`)
  }

  return (
    <PortalLayout title="IndiaBank — Home Loan Pre-screening" color="blue">
      <div className="max-w-3xl mx-auto py-12">
        <StepIndicator currentStep={2} steps={['Application', 'Verification', 'Result']} />
        
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8">
          <QrVerifier 
            claimType="composite_income_cibil"
            onVerified={handleVerified}
            onDenied={handleDenied}
          />
        </div>
      </div>
    </PortalLayout>
  )
}
