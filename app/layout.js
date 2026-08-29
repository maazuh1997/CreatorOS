import './globals.css'

export const metadata = {
  title: 'CreatorOS — Create content faster',
  description: 'AI creative workspace for creators and brands.'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
