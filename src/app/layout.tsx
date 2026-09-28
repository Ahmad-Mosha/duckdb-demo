import type { Metadata } from 'next'
import '@fontsource/dm-sans/latin-400.css'
import '@fontsource/dm-sans/latin-500.css'
import '@fontsource/dm-sans/latin-600.css'
import '@fontsource/dm-mono/latin-400.css'
import '@fontsource/dm-mono/latin-500.css'
import './globals.css'
import '../styles.css'

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
