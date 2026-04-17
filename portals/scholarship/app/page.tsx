import Link from 'next/link'
import PortalLayout from '../../shared/PortalLayout'
import { GraduationCap, ShieldCheck, Zap } from 'lucide-react'

export default function Home() {
  return (
    <PortalLayout title="Prime Minister's National Scholarship Portal">
      <div className="py-12 flex flex-col items-center text-center space-y-8">
        <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600 shadow-inner">
          <GraduationCap size={40} />
        </div>
        
        <div className="space-y-4 max-w-2xl">
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Education for All, <br />
            <span className="text-orange-600">Empowering India's Future</span>
          </h2>
          <p className="text-lg text-gray-600">
            Apply for national scholarships with the new <span className="font-bold text-gray-900">QAVACH</span> private verification system. No document uploads, 100% privacy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-8">
          <FeatureCard 
            icon={<Zap className="text-amber-500" />}
            title="Instant Approval"
            desc="Verify eligibility in under 10 seconds via QR scan."
          />
          <FeatureCard 
            icon={<ShieldCheck className="text-green-500" />}
            title="Quantum-Safe"
            desc="Your data is protected by NIST-standardized PQC."
          />
          <FeatureCard 
            icon={<div className="font-bold text-blue-500">0%</div>}
            title="Data Exposure"
            desc="Original documents never leave your phone."
          />
        </div>

        <div className="pt-8">
          <Link 
            href="/apply" 
            className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-orange-200 transition-all hover:-translate-y-1 active:translate-y-0"
          >
            Apply for 2024-25 Session
          </Link>
          <p className="mt-4 text-xs text-gray-400">Applications open until 31st March 2026</p>
        </div>
      </div>
    </PortalLayout>
  )
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-left">
      <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center mb-4 text-xl">
        {icon}
      </div>
      <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </div>
  )
}
