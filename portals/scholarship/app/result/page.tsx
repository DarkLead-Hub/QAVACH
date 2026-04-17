'use client'
import { useSearchParams } from 'next/navigation'
import PortalLayout from '../../../shared/PortalLayout'
import { PqcSecurityBadge } from '../../../shared/SecurityBadge'
import { CheckCircle, XCircle, FileText, Calendar, Building, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function ResultPage() {
  const searchParams = useSearchParams()
  const isVerified = searchParams.get('verified') === 'true'
  const name = searchParams.get('name')
  const course = searchParams.get('course')
  const algorithm = searchParams.get('algorithm')
  const issuer = searchParams.get('issuer')
  const timestamp = searchParams.get('timestamp')
  const reason = searchParams.get('reason')

  return (
    <PortalLayout title="Application Status">
      <div className="max-w-2xl mx-auto py-8">
        {isVerified ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden">
              <div className="bg-green-50 p-8 flex flex-col items-center text-center">
                <CheckCircle className="text-green-500 mb-4" size={64} />
                <h2 className="text-3xl font-extrabold text-gray-900">Application Submitted</h2>
                <p className="text-green-700 font-medium mt-2">Income Eligibility Verified via QAVACH</p>
              </div>

              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Applicant</h3>
                    <p className="text-lg font-bold text-gray-900">{name}</p>
                    <p className="text-sm text-gray-500">{course}</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Application ID</h3>
                    <p className="text-lg font-mono font-bold text-gray-900">PMSS-2024-{Math.floor(Math.random() * 90000 + 10000)}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Verification Details</h3>
                  <div className="space-y-3">
                    <DetailRow icon={<ShieldCheck size={16} />} label="Security" value={<PqcSecurityBadge algorithm={algorithm || 'ML-DSA-44'} />} />
                    <DetailRow icon={<Building size={16} />} label="Verified Against" value={issuer || 'Income Tax Dept'} />
                    <DetailRow icon={<Calendar size={16} />} label="Verified At" value={timestamp ? new Date(timestamp).toLocaleString() : 'Just now'} />
                    <DetailRow icon={<FileText size={16} />} label="Document Shared" value="NONE (Zero-Knowledge Proof)" valueClass="text-green-600 font-bold" />
                  </div>
                </div>

                <div className="pt-4">
                  <Link href="/" className="block w-full bg-gray-900 text-white text-center font-bold py-4 rounded-xl hover:bg-black transition-all">
                    Return to Dashboard
                  </Link>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-gray-400">
              You will receive a confirmation SMS on your Aadhaar-linked mobile number.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
            <div className="bg-red-50 p-8 flex flex-col items-center text-center">
              <XCircle className="text-red-500 mb-4" size={64} />
              <h2 className="text-3xl font-extrabold text-gray-900">Verification Failed</h2>
              <p className="text-red-700 font-medium mt-2">Policy Check Denied on Device</p>
            </div>
            <div className="p-8 text-center space-y-6">
              <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-red-800 text-sm">
                <span className="font-bold">Reason:</span> {reason || 'The provided credentials do not meet the eligibility criteria for this scholarship.'}
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Your application could not be processed because the required claim could not be proven. 
                Please ensure your QAVACH wallet has a valid, unexpired Income Certificate from the ITD.
              </p>
              <Link href="/apply" className="inline-block font-bold text-orange-600 hover:underline">
                ← Try again with different details
              </Link>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  )
}

function DetailRow({ icon, label, value, valueClass = "text-gray-900" }: { icon: React.ReactNode, label: string, value: React.ReactNode, valueClass?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className={valueClass}>{value}</div>
    </div>
  )
}
