import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import TopBar from './components/layout/TopBar'
import Overview from './pages/Overview'
import DeptDetail from './pages/DeptDetail'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-surface">
          <TopBar />
          <main className="max-w-7xl mx-auto px-4 py-6">
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/dept/:id" element={<DeptDetail />} />
            </Routes>
          </main>
          <footer className="text-center py-6 text-[10px] text-gray-700">
            QAVACH · Post-Quantum Cryptography for Indian e-Governance · NIST FIPS 203/204/205
          </footer>
        </div>
      </Router>
    </QueryClientProvider>
  )
}
