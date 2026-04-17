'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PortalLayout from '../../../shared/PortalLayout'
import StepIndicator from '../../../shared/StepIndicator'

export default function ApplyPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: '',
    loanAmount: '',
    propertyLocation: '',
    employmentType: 'Salaried',
    mobile: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, we'd save the form state to a database/session
    router.push(`/verify?name=${encodeURIComponent(formData.fullName)}&amount=${formData.loanAmount}`)
  }

  return (
    <PortalLayout title="IndiaBank — Home Loan Pre-screening" color="blue">
      <div className="max-w-3xl mx-auto py-12">
        <StepIndicator currentStep={1} steps={['Application', 'Verification', 'Result']} />
        
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-blue-50/50 p-8 md:p-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Loan Application</h2>
            <p className="text-gray-500 mt-1">Provide basic details to check your pre-approved limit.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Full Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="As per PAN card"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Mobile Number</label>
                <input 
                  required
                  type="tel" 
                  value={formData.mobile}
                  onChange={e => setFormData({...formData, mobile: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Required Loan Amount (₹)</label>
                <input 
                  required
                  type="number" 
                  value={formData.loanAmount}
                  onChange={e => setFormData({...formData, loanAmount: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="e.g. 50,00,000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Employment Type</label>
                <select 
                  value={formData.employmentType}
                  onChange={e => setFormData({...formData, employmentType: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                >
                  <option>Salaried</option>
                  <option>Self-employed Professional</option>
                  <option>Business Owner</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Property Location</label>
              <input 
                required
                type="text" 
                value={formData.propertyLocation}
                onChange={e => setFormData({...formData, propertyLocation: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="City / Area"
              />
            </div>

            <div className="pt-6 border-t border-gray-100">
              <div className="bg-blue-50 p-4 rounded-2xl mb-8 flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-sm text-blue-800 leading-relaxed">
                  <strong>Privacy First:</strong> No income documents or CIBIL reports required for upload. We will use QAVACH for instant, private eligibility verification.
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
              >
                Proceed to Verification
              </button>
            </div>
          </form>
        </div>
      </div>
    </PortalLayout>
  )
}
