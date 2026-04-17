'use client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import PortalLayout from '../../../shared/PortalLayout'
import StepIndicator from '../../../shared/StepIndicator'
import SecurityBadge from '../../../shared/SecurityBadge'
import { CheckCircle, XCircle, MapPin, ShieldAlert, AlertTriangle, Info } from 'lucide-react'

export default function ResultPage() {
  const searchParams = useSearchParams()
  const verified = searchParams.get('verified') === 'true'
  const name = searchParams.get('name')
  const parcel = searchParams.get('parcel')
  const algorithm = searchParams.get('algorithm')
  const quantumSafe = searchParams.get('quantumSafe') === 'true'
  const reason = searchParams.get('reason')

  return (
    <PortalLayout title="Revenue Department — Land Mutation" color="orange">
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
                <h2 className="text-3xl font-bold text-gray-900">Ownership Verified</h2>
                <p className="text-gray-500">Your mutation request for Parcel {parcel} has been recorded.</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 text-left space-y-4 border border-gray-100">
                <div className="flex items-center gap-3 border-b border-gray-200 pb-4 text-orange-700">
                  <MapPin size={20} />
                  <span className="text-sm font-bold uppercase tracking-wider">Property Details</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Current Owner</p>
                    <p className="font-bold text-gray-900">{name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Parcel ID</p>
                    <p className="font-bold text-gray-900">{parcel}</p>
                  </div>
                </div>

                {!quantumSafe && (
                  <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-amber-800 mb-2">
                      <AlertTriangle size={16} />
                      <span className="text-xs font-bold uppercase tracking-tight">Quantum Safety Warning</span>
                    </div>
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      The underlying credential from <strong>Revenue Department</strong> was signed with <strong>{algorithm || 'RSA-2048'}</strong>. 
                      While valid today, this is not quantum-safe. We recommend updating your records once the department migrates to PQC.
                    </p>
                  </div>
                )}

                <div className="pt-2 flex justify-between items-center">
                  <SecurityBadge algorithm={algorithm || 'RSA-2048'} />
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Info size={10} />
                    <span>Verified via QAVACH</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button className="w-full bg-orange-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 hover:bg-orange-800 transition-all">
                  Download Acknowledgement
                </button>
                <Link href="/" className="text-sm text-gray-500 hover:text-orange-700 transition-colors">
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
                <h2 className="text-3xl font-bold text-gray-900">Verification Failed</h2>
                <p className="text-gray-500">We could not verify your ownership of the specified parcel.</p>
              </div>

              <div className="bg-red-50 rounded-2xl p-6 flex items-start gap-4 text-left border border-red-100">
                <ShieldAlert className="text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="text-sm font-bold text-red-900">Denied</h4>
                  <p className="text-xs text-red-700 mt-1 leading-relaxed">
                    {reason || 'The ownership claim for this property could not be cryptographically proven on your device.'}
                  </p>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <Link href="/apply" className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-black transition-all">
                  Check details and try again
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
