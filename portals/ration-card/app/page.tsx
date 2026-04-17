import Link from 'next/link'

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-20">
      <div className="max-w-2xl">
        <h2 className="text-4xl font-bold text-gray-900 mb-6 tracking-tight">
          National Public Distribution System
        </h2>
        <p className="text-lg text-gray-600 mb-10 leading-relaxed">
          The National Food Security Act (NFSA) aims to provide for food and nutritional security in human life cycle approach, by ensuring access to adequate quantity of quality food at affordable prices.
        </p>
        
        <div className="flex gap-4">
          <Link 
            href="/apply"
            className="px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors"
          >
            Apply for New Ration Card
          </Link>
          <button className="px-8 py-4 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-bold rounded-lg transition-all">
            Track Application
          </button>
        </div>
      </div>
      
      <div className="mt-24 grid grid-cols-3 gap-8">
        {[
          { title: 'Antyodaya Anna Yojana', desc: 'Poorest of the poor families' },
          { title: 'Priority Households', desc: 'Targeted support for low income groups' },
          { title: 'State NFSA Portal', desc: 'Direct access to local state data' },
        ].map((item, idx) => (
          <div key={idx} className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm">
            <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
            <p className="text-sm text-gray-500">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
