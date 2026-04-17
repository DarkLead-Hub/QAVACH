import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'IndiaBank — Home Loan Pre-screening',
  description: 'Check your home loan eligibility instantly with QAVACH quantum-safe verification. Income and credit profile verified privately.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
