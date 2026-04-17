'use client'
import { useRouter } from 'next/navigation'
import PortalLayout from '../../../shared/PortalLayout'
import { Info } from 'lucide-react'

export default function ApplyPage() {
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name')
    const course = formData.get('course')
    router.push(`/verify?name=${encodeURIComponent(name as string)}&course=${encodeURIComponent(course as string)}`)
  }

  return (
    <PortalLayout title="PM Scholarship Application">
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900">Application Form</h2>
            <p className="text-sm text-gray-500 mt-1">Please fill in your academic details to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Full Name</label>
                <input required name="name" type="text" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" placeholder="Enter as per Aadhaar" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Date of Birth</label>
                <input required name="dob" type="date" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Course Name</label>
              <input required name="course" type="text" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" placeholder="e.g. B.Tech Computer Science" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Institution Name</label>
              <input required name="institution" type="text" className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all" placeholder="e.g. IIT Bangalore" />
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
              <Info className="text-blue-500 shrink-0 mt-0.5" size={18} />
              <div className="text-xs text-blue-700 leading-relaxed">
                <span className="font-bold">Privacy Note:</span> In the next step, we will verify your income eligibility using QAVACH. You will <span className="font-bold">not</span> be asked to upload an income certificate. Your original documents stay on your phone.
              </div>
            </div>

            <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-100">
              Continue to Income Verification →
            </button>
          </form>
        </div>
      </div>
    </PortalLayout>
  )
}
