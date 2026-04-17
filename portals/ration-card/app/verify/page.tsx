'use client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, ShieldAlert, AlertTriangle, FileText, ArrowRight } from 'lucide-react'

export default function VerifyPage() {
  const searchParams = useSearchParams()
  const filename = searchParams.get('filename') || 'income_certificate.pdf'

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden text-center">
        <div className="p-12 space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600">
              <CheckCircle2 size={48} />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Application Submitted</h2>
            <p className="text-sm text-gray-500">Your Ration Card application has been received and the document was verified.</p>
          </div>

          <div className="border border-amber-200 rounded-xl p-6 bg-amber-50 text-left">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-gray-600" />
              <span className="font-bold text-sm text-gray-700">Document verification result</span>
              <span className="ml-auto text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300 font-bold uppercase tracking-tighter">
                NOT quantum-safe
              </span>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-amber-100 pb-2">
                <span className="text-gray-500 font-medium">Verified File</span>
                <span className="text-gray-900 font-mono">{filename}</span>
              </div>
              <div className="flex justify-between border-b border-amber-100 pb-2">
                <span className="text-gray-500 font-medium">Signing Authority</span>
                <span className="text-gray-900 font-bold">Revenue Department</span>
              </div>
              <div className="flex justify-between border-b border-amber-100 pb-2">
                <span className="text-gray-500 font-medium">Algorithm</span>
                <span className="text-gray-900 font-mono">RSA-2048 (FIPS 186-4)</span>
              </div>
              <div className="flex justify-between border-b border-amber-100 pb-2">
                <span className="text-gray-500 font-medium">Quantum Safe</span>
                <span className="text-red-600 font-bold uppercase tracking-widest">No ✗</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Data Storage</span>
                <span className="text-red-600 font-bold">PDF STORED ON SERVER</span>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-amber-200 flex gap-3 items-start">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-700 leading-relaxed italic">
                <strong>Migration Advisory:</strong> This portal uses classical cryptography. Your data was uploaded to a central server. 
                Consider using <strong>QAVACH-enabled</strong> portals for better privacy and future-proof security.
              </p>
            </div>
          </div>

          <div className="pt-8 space-y-4">
            <Link 
              href="http://localhost:3001" 
              className="group flex items-center justify-center gap-2 w-full bg-gray-900 text-white font-bold py-4 rounded hover:bg-black transition-all"
            >
              See how QAVACH does this differently
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/apply" className="text-xs text-gray-400 underline uppercase tracking-widest font-bold block">
              Back to form
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
