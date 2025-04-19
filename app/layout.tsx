// app/layout.tsx

import './globals.css'
import Providers from './providers'

export const metadata = {
  title: 'VectorDB SaaS',
  description: 'Sistema de banco de dados vetorial para empresas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
