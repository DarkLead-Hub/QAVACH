'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, CheckCircle2 } from 'lucide-react'

export default function ApplyPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsProcessing] = useState(false)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    
    // In a real classical portal, we'd POST the whole file to a server
    // For this demo, we simulate processing and then redirect
    await new Duration(2000)
    router.push('/verify?filename=' + (file?.name || 'income_cert.pdf'))
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900">New Ration Card Application</h2>
          <p className="text-sm text-gray-500 mt-1">Please fill all mandatory fields and upload required documents.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Family Head Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase">Full Name</label>
                <input required type="text" className="w-full px-3 py-2 text-sm border border-gray-200 rounded outline-none focus:border-amber-500 transition-colors" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase">Mobile Number</label>
                <input required type="tel" className="w-full px-3 py-2 text-sm border border-gray-200 rounded outline-none focus:border-amber-500 transition-colors" />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Residential Address</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase">State</label>
                <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded bg-white">
                  <option>Karnataka</option>
                  <option>Maharashtra</option>
                  <option>Punjab</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase">District</label>
                <input required type="text" className="w-full px-3 py-2 text-sm border border-gray-200 rounded" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase">Pincode</label>
                <input required type="text" className="w-full px-3 py-2 text-sm border border-gray-200 rounded" />
              </div>
            </div>
          </div>

          {/* Document Upload — The "Classical" Way */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Eligibility Proof</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase">Monthly Family Income (₹)</label>
                <input required type="number" className="w-full px-3 py-2 text-sm border border-gray-200 rounded outline-none focus:border-amber-500" />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase italic">Upload Income Certificate (PDF)</label>
                <div className={`border-2 border-dashed rounded-xl p-8 transition-colors text-center ${file ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:border-amber-300 bg-gray-50'}`}>
                  {file ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="text-green-600 w-10 h-10" />
                      <span className="text-sm font-medium text-green-800">{file.name}</span>
                      <button type="button" onClick={() => setFile(null)} className="text-[10px] text-red-500 font-bold uppercase underline">Remove</button>
                    </div>
                  ) : (
                    <label className="cursor-pointer group">
                      <Upload className="mx-auto w-10 h-10 text-gray-300 group-hover:text-amber-400 transition-colors mb-2" />
                      <span className="text-sm font-medium text-gray-600 block">Select PDF Document</span>
                      <span className="text-[10px] text-gray-400 uppercase mt-1 block tracking-wider">Max size 2MB</span>
                      <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
                    </label>
                  )}
                </div>
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                  <p className="text-[10px] text-amber-700 leading-tight">
                    <strong>Note:</strong> Your income certificate will be uploaded to our government servers for signature verification. 
                    Contrast this with <strong>QAVACH</strong> portals where documents never leave your device.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit"
              disabled={!file || isUploading}
              className={`w-full font-bold py-4 rounded shadow-sm transition-all ${!file || isUploading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-100'}`}
            >
              {isUploading ? 'Uploading & Processing...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Mock helper
function Duration(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
