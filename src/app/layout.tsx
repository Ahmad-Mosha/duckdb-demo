import type { Metadata } from 'next'
import '@fontsource-variable/geist'
import '@fontsource-variable/jetbrains-mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'Commerce Lab — Local data workspace',
  description: 'Explore Amazon and Noon settlement reports locally with DuckDB.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}
