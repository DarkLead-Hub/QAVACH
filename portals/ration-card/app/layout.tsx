import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../../scholarship/app/globals.css' // Reuse scholarship styles
import { ClassicalWarningBanner } from '../components/ClassicalWarningBanner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ration Card Portal (Classical)',
  description: 'National Public Distribution System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <ClassicalWarningBanner algorithm="RSA-2048" deptName="Revenue Department" />
          
          <header className="bg-white border-b border-gray-200">
            <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center font-bold text-gray-400">
                  🏛️
                </div>
                <div>
                  <h1 className="text-sm font-bold text-gray-900 leading-none">NFSA</h1>
                  <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Public Distribution System</p>
                </div>
              </div>
              <nav className="flex gap-6 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <a href="#" className="hover:text-gray-900">Home</a>
                <a href="#" className="hover:text-gray-900 text-gray-900 border-b-2 border-amber-500 pb-5 translate-y-[1px]">Apply</a>
                <a href="#" className="hover:text-gray-900">Track</a>
              </nav>
            </div>
          </header>

          <main className="flex-1">
            {children}
          </main>

          <footer className="bg-gray-100 border-t border-gray-200 py-8">
            <div className="max-w-5xl mx-auto px-4 flex justify-between items-center text-[10px] text-gray-400 uppercase font-bold tracking-widest">
              <span>National Food Security Act © 2024</span>
              <div className="flex gap-4">
                <a href="#">Privacy</a>
                <a href="#">Terms</a>
                <a href="#">Contact</a>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
