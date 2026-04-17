'use client'
import { useState, useEffect } from 'react'
import QRCode from 'react-qr-code'
import { Shield, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'

type VerifyStatus = 'loading' | 'ready' | 'scanned' | 'verified' | 'denied' | 'expired' | 'error'

interface Props {
  claimType: string
  portalId: string
  label?: string
  instructions?: string[]
  onVerified: (result: any) => void
  onDenied: (reason: string) => void
}

export default function QrVerifier({ 
  claimType, 
  portalId, 
  label = 'Verify with QAVACH', 
  instructions = [
    'Open QAVACH app on your phone',
    'Tap "Scan to Verify"',
    'Point camera at this QR code'
  ],
  onVerified, 
  onDenied 
}: Props) {
  const [status, setStatus] = useState<VerifyStatus>('loading')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [qrPayload, setQrPayload] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(300)

  useEffect(() => {
    async function createSession() {
      try {
        const res = await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ claim_type: claimType, portal_id: portalId }),
        })
        const data = await res.json()
        setSessionId(data.session_id)
        setQrPayload(JSON.stringify(data.qr_payload))
        setStatus('ready')
      } catch (e) {
        setStatus('error')
      }
    }
    createSession()
  }, [claimType, portalId])

  useEffect(() => {
    if (!sessionId || status !== 'ready') return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/session/${sessionId}`)
        const data = await res.json()
        
        if (data.status === 'verified') {
          setStatus('verified')
          clearInterval(interval)
          setTimeout(() => onVerified(data.result), 1500)
        } else if (data.status === 'denied') {
          setStatus('denied')
          clearInterval(interval)
          setTimeout(() => onDenied('Policy check failed on device'), 1500)
        } else if (data.status === 'expired') {
          setStatus('expired')
          clearInterval(interval)
        }
      } catch (e) {
        // Continue polling on transient errors
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [sessionId, status, onVerified, onDenied])

  useEffect(() => {
    if (status !== 'ready') return
    const timer = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000)
    return () => clearInterval(timer)
  }, [status])

  return (
    <div className="flex flex-col items-center gap-6 p-8 bg-white rounded-2xl shadow-xl border border-gray-100 max-w-sm mx-auto">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">{label}</h2>
        <p className="text-sm text-gray-500 mt-1">Scan to prove eligibility privately</p>
      </div>

      <div className="relative">
        {status === 'loading' && (
          <div className="w-52 h-52 bg-gray-50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        )}

        {status === 'ready' && qrPayload && (
          <div className="p-4 bg-white rounded-xl border-2 border-indigo-50 shadow-inner">
            <QRCode value={qrPayload} size={180} />
          </div>
        )}

        {status === 'verified' && (
          <div className="w-52 h-52 bg-green-50 rounded-xl border-2 border-green-500 flex flex-col items-center justify-center gap-3 animate-in zoom-in-95 duration-300">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <span className="text-green-700 font-bold tracking-tight">VERIFIED</span>
          </div>
        )}

        {status === 'denied' && (
          <div className="w-52 h-52 bg-red-50 rounded-xl border-2 border-red-400 flex flex-col items-center justify-center gap-3 animate-in zoom-in-95 duration-300">
            <XCircle className="w-16 h-16 text-red-400" />
            <span className="text-red-600 font-bold tracking-tight">NOT ELIGIBLE</span>
          </div>
        )}
      </div>

      {status === 'ready' && (
        <div className="flex items-center gap-1.5 text-xs font-mono text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
          <Clock className="w-3 h-3" />
          Expires in {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
        </div>
      )}

      <div className="space-y-3 w-full">
        <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside bg-gray-50/50 p-4 rounded-xl border border-gray-100">
          {instructions.map((inst, i) => (
            <li key={i} className="pl-1">{inst}</li>
          ))}
        </ol>

        <div className="flex items-center gap-2.5 text-[10px] text-gray-400 border-t border-gray-100 pt-4 mt-2">
          <Shield className="w-4 h-4 text-green-500 flex-shrink-0" />
          <span className="leading-tight">
            Protected by <span className="font-bold text-gray-600">ML-DSA-44</span> (NIST FIPS 204). 
            Your personal documents never leave your device.
          </span>
        </div>
      </div>
    </div>
  )
}
