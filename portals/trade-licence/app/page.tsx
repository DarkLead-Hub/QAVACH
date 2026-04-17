import Link from 'next/link'

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-20">
      <div className="max-w-2xl">
        <h2 className="text-4xl font-bold text-slate-900 mb-6 tracking-tight">
          Business Trade Licensing
        </h2>
        <p className="text-lg text-slate-600 mb-10 leading-relaxed">
          The Municipal Corporation's online portal for new trade licence applications and existing licence renewals. Ensure your business is compliant with local regulations.
        </p>
        
        <div className="flex gap-4">
          <Link 
            href="/apply"
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-indigo-200"
          >
            Apply for New Licence
          </Link>
          <button className="px-8 py-4 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-lg transition-all">
            Renew Existing Licence
          </button>
        </div>
      </div>
      
      <div className="mt-24 grid grid-cols-3 gap-8">
        {[
          { title: 'General Trade', desc: 'Retail shops, offices, and showrooms' },
          { title: 'Food & Health', desc: 'Restaurants, cafes, and clinics' },
          { title: 'Industrial', desc: 'Manufacturing and large-scale storage' },
        ].map((item, idx) => (
          <div key={idx} className="p-6 bg-white border border-slate-100 rounded-xl shadow-sm">
            <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
            <p className="text-sm text-slate-500">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
