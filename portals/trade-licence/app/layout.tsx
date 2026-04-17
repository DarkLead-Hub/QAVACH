import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../../scholarship/app/globals.css'
import { ClassicalWarningBanner } from '../components/ClassicalWarningBanner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Trade Licence Portal (Classical)',
  description: 'Municipal Corporation Business Licensing',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <ClassicalWarningBanner algorithm="ECDSA P-256" deptName="Municipal Corporation" />
          
          <header className="bg-white border-b border-slate-200">
            <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-white text-xs">
                  MC
                </div>
                <div>
                  <h1 className="text-sm font-bold text-slate-900 leading-none">MUNICIPAL CORP</h1>
                  <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Trade Licensing Division</p>
                </div>
              </div>
              <nav className="flex gap-6 text-xs font-medium text-slate-500 uppercase tracking-wide">
                <a href="#" className="hover:text-indigo-600">Dashboard</a>
                <a href="#" className="hover:text-indigo-600 text-indigo-600 border-b-2 border-indigo-600 pb-5 translate-y-[1px]">Apply</a>
                <a href="#" className="hover:text-indigo-600">Renewal</a>
              </nav>
            </div>
          </header>

          <main className="flex-1">
            {children}
          </main>

          <footer className="bg-slate-100 border-t border-slate-200 py-8">
            <div className="max-w-5xl mx-auto px-4 flex justify-between items-center text-[10px] text-slate-400 uppercase font-bold tracking-widest">
              <span>MC Trade Licensing © 2024</span>
              <div className="flex gap-4">
                <a href="#">Bylaws</a>
                <a href="#">Compliance</a>
                <a href="#">Contact</a>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
