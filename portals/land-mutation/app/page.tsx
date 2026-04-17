import Link from 'next/link'
import PortalLayout from '../../shared/PortalLayout'
import { Map, ArrowRightLeft, ShieldAlert } from 'lucide-react'

export default function Home() {
  return (
    <PortalLayout title="Revenue Department — Land Mutation" color="orange">
      <div className="py-12 flex flex-col items-center text-center space-y-8">
        <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center text-orange-600 shadow-inner">
          <Map size={40} />
        </div>
        
        <div className="space-y-4 max-w-2xl">
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Seamless Property <br />
            <span className="text-orange-700">Mutation Transfer</span>
          </h2>
          <p className="text-lg text-gray-600">
            Verify property ownership instantly using <span className="font-bold text-gray-900">QAVACH</span>. 
            No more physical visits or manual document verification for mutation requests.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-8 text-left">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mb-4 text-orange-600">
              <ArrowRightLeft size={20} />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Instant Transfer</h3>
            <p className="text-xs text-gray-500">Ownership verification completed in seconds via QR scan.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mb-4 text-orange-600">
              <ShieldAlert size={20} />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Mixed-Mode Support</h3>
            <p className="text-xs text-gray-500">Works with existing classical documents while highlighting PQC gaps.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mb-4 text-orange-600 text-xl">
              📍
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Parcel Precision</h3>
            <p className="text-xs text-gray-500">Verifies specific land parcel IDs directly against Revenue records.</p>
          </div>
        </div>

        <div className="pt-8">
          <Link 
            href="/apply" 
            className="bg-orange-700 hover:bg-orange-800 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-orange-200 transition-all hover:-translate-y-1 active:translate-y-0"
          >
            Initiate Mutation
          </Link>
        </div>
      </div>
    </PortalLayout>
  )
}
