'use client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import PortalLayout from '../../../shared/PortalLayout'
import StepIndicator from '../../../shared/StepIndicator'
import SecurityBadge from '../../../shared/SecurityBadge'
import { CheckCircle, XCircle, FileCheck, ShieldAlert, CreditCard, Wallet } from 'lucide-react'

export default function ResultPage() {
  const searchParams = useSearchParams()
  const verified = searchParams.get('verified') === 'true'
  const name = searchParams.get('name')
  const amount = searchParams.get('amount')
  const algorithm = searchParams.get('algorithm')
  const reason = searchParams.get('reason')

  return (
    <PortalLayout title="IndiaBank — Home Loan Pre-screening" color="blue">
      <div className="max-w-3xl mx-auto py-12">
        <StepIndicator currentStep={3} steps={['Application', 'Verification', 'Result']} />
        
        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl p-8 md:p-12 text-center">
          {verified ? (
            <div className="space-y-8">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <CheckCircle size={48} />
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">Pre-approved!</h2>
                <p className="text-gray-500">Congratulations {name}, you are eligible for a home loan.</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 text-left space-y-4 border border-gray-100">
                <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                  <div className="flex items-center gap-3">
                    <Wallet className="text-blue-600 w-5 h-5" />
                    <span className="text-sm font-medium text-gray-600">Requested Amount</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">₹{Number(amount).toLocaleString()}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 text-green-600 mb-1">
                      <FileCheck size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Income Check</span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">Verified &gt; ₹5,00,000</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 text-green-600 mb-1">
                      <CreditCard size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Credit Signal</span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">Positive profile</p>
                  </div>
                </div>

                <div className="pt-2">
                  <SecurityBadge algorithm={algorithm || 'ML-DSA-44'} />
                  <p className="text-[10px] text-gray-400 mt-2 italic">
                    All eligibility checks were performed on your device. IndiaBank received only the verified claim.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button className="w-full bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-800 transition-all">
                  Proceed to Property Valuation
                </button>
                <Link href="/" className="text-sm text-gray-500 hover:text-blue-700 transition-colors">
                  Return to portal home
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                  <XCircle size={48} />
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">Not Eligible</h2>
                <p className="text-gray-500">Based on the on-device policy check, we cannot approve your request at this time.</p>
              </div>

              <div className="bg-red-50 rounded-2xl p-6 flex items-start gap-4 text-left border border-red-100">
                <ShieldAlert className="text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-sm font-bold text-red-900">Verification Denied</h4>
                  <p className="text-xs text-red-700 mt-1 leading-relaxed">
                    {reason || 'The requirements for income or credit profile were not met according to your QAVACH records.'}
                  </p>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <Link href="/apply" className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-black transition-all">
                  Try again with different details
                </Link>
                <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  Return to portal home
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  )
}
