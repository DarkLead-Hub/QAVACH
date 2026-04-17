import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchDeptDetail } from '../api/govsign'
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, Info } from 'lucide-react'

export default function DeptDetail() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading, error } = useQuery({
    queryKey: ['dept', id],
    queryFn: () => fetchDeptDetail(id!),
    enabled: !!id,
  })

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading department details...</div>
  if (error || !data) return <div className="p-8 text-center text-red-500">Department not found.</div>

  const isPqc = data.quantum_safe

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Overview
      </Link>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* Main Info Card */}
          <div className="bg-surface-2 border border-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-gray-100">{data.name}</h1>
                <p className="text-gray-500 mt-1">Department ID: {data.dept_id}</p>
              </div>
              <div className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
                isPqc ? 'bg-pqc/10 border-pqc/20 text-pqc' : 'bg-classical/10 border-classical/20 text-classical'
              }`}>
                {isPqc ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                <span className="font-semibold uppercase tracking-wider text-sm">
                  {isPqc ? 'PQC READY' : 'CLASSICAL RISK'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Algorithm Details</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500">Primary Signature Algorithm</p>
                    <p className="text-sm font-mono text-accent mt-1">{data.algorithm}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Security Status</p>
                    <p className={`text-sm mt-1 font-medium ${isPqc ? 'text-pqc' : 'text-classical'}`}>
                      {isPqc ? 'NIST Standard Post-Quantum' : 'Vulnerable Classical'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Public Key</h3>
                <div className="bg-surface/50 border border-gray-800 rounded-lg p-3 relative group">
                  <p className="text-[10px] font-mono text-gray-400 break-all line-clamp-4">
                    {data.public_key_b64}
                  </p>
                  <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                    <button className="text-xs text-white underline cursor-pointer">Copy Public Key</button>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 mt-2 italic">
                  Registered at: {new Date(data.registered_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Migration Guidance */}
          {!isPqc && (
            <div className="bg-classical/5 border border-classical/20 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-classical/10 flex items-center justify-center flex-shrink-0">
                  <Info className="w-5 h-5 text-classical" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-100">Migration Advisory</h3>
                  <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                    This department is still using classical {data.algorithm} signatures. While secure against current threats, this algorithm will be vulnerable to forgery once cryptographically relevant quantum computers become available. 
                  </p>
                  <p className="text-sm text-gray-400 mt-4">
                    Recommendation: Migrate to <span className="text-pqc">ML-DSA-65</span> (FIPS 204) for fast signatures or <span className="text-pqc">SLH-DSA</span> (FIPS 205) for long-term archival.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Side Panel: Usage & Activity */}
        <div className="space-y-6">
          <div className="bg-surface-2 border border-gray-800 rounded-xl p-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Deployment Usage</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-sm font-medium text-gray-200">Credential Issuance</p>
                  <p className="text-xs text-gray-500">Signs citizen documents</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
