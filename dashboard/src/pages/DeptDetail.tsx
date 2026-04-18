import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchDeptDetail } from '../api/govsign'
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, Info, Copy, ExternalLink, Clock, Fingerprint } from 'lucide-react'
import { useState } from 'react'

export default function DeptDetail() {
  const { id } = useParams<{ id: string }>()
  const [copied, setCopied] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['dept', id],
    queryFn: () => fetchDeptDetail(id!),
    enabled: !!id,
  })

  const handleCopy = () => {
    if (data?.public_key_b64) {
      navigator.clipboard.writeText(data.public_key_b64)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="skeleton h-8 w-48" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 skeleton h-64 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">Department Not Found</h2>
        <p className="text-sm text-gray-400 mb-6">The department ID "{id}" does not exist in the registry.</p>
        <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-medium rounded-xl hover:bg-accent-dark transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Overview
        </Link>
      </div>
    )
  }

  const isPqc = data.quantum_safe

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Navigation */}
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-accent transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Overview
      </Link>

      {/* Hero Section */}
      <div className={`glass-card-static p-6 relative overflow-hidden`}>
        {/* Background accent gradient */}
        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10 ${
          isPqc ? 'bg-pqc' : 'bg-classical'
        }`} />

        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
              isPqc
                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-200'
                : 'bg-gradient-to-br from-red-400 to-red-600 shadow-red-200'
            }`}>
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{data.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-400 font-mono">{data.dept_id}</span>
                <span className="text-gray-300">·</span>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  Registered: {new Date(data.registered_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          <div className={`px-4 py-2.5 rounded-xl border-2 flex items-center gap-2 ${
            isPqc
              ? 'bg-pqc-light border-pqc/20 text-pqc-dark'
              : 'bg-classical-light border-classical/20 text-classical-dark'
          }`}>
            {isPqc ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span className="font-bold uppercase tracking-wider text-sm">
              {isPqc ? 'PQC READY' : 'CLASSICAL RISK'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-5">
          {/* Algorithm Details Card */}
          <div className="glass-card-static p-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em] mb-5 flex items-center gap-2">
              <Fingerprint className="w-4 h-4" />
              Algorithm Details
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-100">
                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium mb-1">Primary Signature Algorithm</p>
                <p className="text-lg font-mono font-bold text-accent">{data.algorithm}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50/70 border border-gray-100">
                <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium mb-1">Security Classification</p>
                <p className={`text-lg font-bold ${isPqc ? 'text-pqc' : 'text-classical'}`}>
                  {isPqc ? 'NIST Post-Quantum Standard' : 'Vulnerable Classical'}
                </p>
              </div>
            </div>
          </div>

          {/* Public Key Card */}
          <div className="glass-card-static p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em]">Public Key (Base64)</h3>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 border border-gray-200 hover:bg-accent hover:text-white hover:border-accent transition-all cursor-pointer text-gray-500"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copied!' : 'Copy Key'}
              </button>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 relative">
              <p className="text-[11px] font-mono text-gray-500 break-all leading-relaxed line-clamp-4">
                {data.public_key_b64}
              </p>
            </div>
          </div>

          {/* Migration Guidance */}
          {!isPqc && (
            <div className="relative overflow-hidden rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-orange-50 p-6">
              <div className="absolute top-0 right-0 w-40 h-40 bg-red-100 rounded-full blur-3xl opacity-30" />
              <div className="relative flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Info className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Migration Advisory</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    This department is still using classical <span className="font-mono font-semibold text-classical">{data.algorithm}</span> signatures. While secure against current threats, this algorithm will be vulnerable to forgery once cryptographically relevant quantum computers become available.
                  </p>
                  <div className="flex items-center gap-3 mt-4">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/70 border border-pqc/20">
                      <span className="text-xs text-gray-500">Recommended:</span>
                      <span className="text-xs font-mono font-bold text-pqc">ML-DSA-65</span>
                      <span className="text-[10px] text-gray-400">(FIPS 204)</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/70 border border-pqc/20">
                      <span className="text-xs text-gray-500">Alternative:</span>
                      <span className="text-xs font-mono font-bold text-pqc">SLH-DSA</span>
                      <span className="text-[10px] text-gray-400">(FIPS 205)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="space-y-5">
          {/* Usage Card */}
          <div className="glass-card-static p-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em] mb-4">Deployment Usage</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-9 h-9 rounded-lg bg-accent-light flex items-center justify-center">
                  <Shield className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Credential Issuance</p>
                  <p className="text-[11px] text-gray-500">Signs citizen documents</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-9 h-9 rounded-lg bg-pqc-light flex items-center justify-center">
                  <ExternalLink className="w-4 h-4 text-pqc" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">External Verification</p>
                  <p className="text-[11px] text-gray-500">Public key verifiable</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Card */}
          <div className="glass-card-static p-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.15em] mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-xs text-gray-500">Algorithm Type</span>
                <span className={`text-xs font-bold ${isPqc ? 'text-pqc' : 'text-classical'}`}>
                  {isPqc ? 'Post-Quantum' : 'Classical'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-xs text-gray-500">NIST Standard</span>
                <span className="text-xs font-medium text-gray-700">
                  {isPqc ? 'FIPS 204/205' : 'Legacy'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-gray-500">Key Format</span>
                <span className="text-xs font-medium text-gray-700">Base64</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
