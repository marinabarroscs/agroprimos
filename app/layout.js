import './globals.css'

export const metadata = {
  title: 'AgroPrimos - Gestão de Gado',
  description: 'Sistema de gestão de gado da Agropecuária Cambui',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
