'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PortalLayout from '../../../shared/PortalLayout'
import StepIndicator from '../../../shared/StepIndicator'

export default function ApplyPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    ownerName: '',
    parcelId: '',
    newOwnerName: '',
    reason: 'Sale',
    reference: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/verify?name=${encodeURIComponent(formData.ownerName)}&parcel=${formData.parcelId}`)
  }

  return (
    <PortalLayout title="Revenue Department — Land Mutation" color="orange">
      <div className="max-w-3xl mx-auto py-12">
        <StepIndicator currentStep={1} steps={['Application', 'Verification', 'Result']} />
        
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8 md:p-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Mutation Request</h2>
            <p className="text-gray-500 mt-1">Submit property details for ownership transfer.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Current Owner Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.ownerName}
                  onChange={e => setFormData({...formData, ownerName: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  placeholder="As per land record"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Parcel ID (Khasra No.)</label>
                <input 
                  required
                  type="text" 
                  value={formData.parcelId}
                  onChange={e => setFormData({...formData, parcelId: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  placeholder="e.g. KA-BLR-001"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">New Owner Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.newOwnerName}
                  onChange={e => setFormData({...formData, newOwnerName: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Reason for Mutation</label>
                <select 
                  value={formData.reason}
                  onChange={e => setFormData({...formData, reason: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all bg-white"
                >
                  <option>Sale</option>
                  <option>Inheritance</option>
                  <option>Gift</option>
                  <option>Court Order</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Sale Deed / Reference Number</label>
              <input 
                required
                type="text" 
                value={formData.reference}
                onChange={e => setFormData({...formData, reference: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              />
            </div>

            <div className="pt-6 border-t border-gray-100">
              <div className="bg-orange-50 p-4 rounded-2xl mb-8 flex items-start gap-3 border border-orange-100">
                <div className="p-2 bg-orange-100 rounded-lg text-orange-600 font-bold">!</div>
                <div className="text-sm text-orange-800 leading-relaxed">
                  <strong>Ownership Verification:</strong> You will be asked to prove ownership of Parcel ID <strong>{formData.parcelId || '...'}</strong> using QAVACH. No physical document upload required.
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-orange-700 hover:bg-orange-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 transition-all"
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
