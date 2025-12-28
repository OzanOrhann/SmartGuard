import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SmartGuard - Güvenli İzleme Sistemi',
  description: 'Yaşlı ve riskli bireylerin sağlık ve güvenlik izleme platformu',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  )
}
