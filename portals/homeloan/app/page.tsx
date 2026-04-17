import Link from 'next/link'
import PortalLayout from '../../shared/PortalLayout'
import { Home as HomeIcon, ShieldCheck, PieChart } from 'lucide-react'

export default function Home() {
  return (
    <PortalLayout title="IndiaBank — Home Loan Pre-screening" color="blue">
      <div className="py-12 flex flex-col items-center text-center space-y-8">
        <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600 shadow-inner">
          <HomeIcon size={40} />
        </div>
        
        <div className="space-y-4 max-w-2xl">
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Your Dream Home, <br />
            <span className="text-blue-700">Verified Privately</span>
          </h2>
          <p className="text-lg text-gray-600">
            Check your eligibility for a Home Loan instantly using <span className="font-bold text-gray-900">QAVACH</span>. 
            We verify your income and credit profile without seeing your documents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-8">
          <FeatureCard 
            icon={<ShieldCheck className="text-green-500" />}
            title="Composite Claims"
            desc="Verify income and CIBIL score in a single proof."
          />
          <FeatureCard 
            icon={<PieChart className="text-blue-500" />}
            title="Instant Eligibility"
            desc="No more waiting for document verification teams."
          />
          <FeatureCard 
            icon={<div className="font-bold text-indigo-500">🔒</div>}
            title="Bank-Grade Security"
            desc="Post-quantum protection for your financial data."
          />
        </div>

        <div className="pt-8">
          <Link 
            href="/apply" 
            className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition-all hover:-translate-y-1 active:translate-y-0"
          >
            Start Pre-screening
          </Link>
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
