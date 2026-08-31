import './globals.css'

export const metadata = {
  metadataBase: new URL('https://creator-os-topaz-sigma.vercel.app'),
  title: { default: 'CreatorOS — AI Creative Workspace', template: '%s — CreatorOS' },
  description: 'Create professional, platform-ready content with AI, media and brand intelligence.',
  applicationName: 'CreatorOS',
  generator: 'Next.js',
  keywords: ['CreatorOS', 'AI content creation', 'social media', 'creator tools', 'content marketing'],
  authors: [{ name: 'CreatorOS' }],
  creator: 'CreatorOS',
  publisher: 'CreatorOS',
  icons: { icon: [{ url: '/icon.svg', type: 'image/svg+xml' }], shortcut: ['/icon.svg'], apple: [{ url: '/icon.svg' }] },
  openGraph: { type: 'website', siteName: 'CreatorOS', title: 'CreatorOS — AI Creative Workspace', description: 'Create professional, platform-ready content with AI, media and brand intelligence.', url: 'https://creator-os-topaz-sigma.vercel.app' },
  twitter: { card: 'summary', title: 'CreatorOS — AI Creative Workspace', description: 'Create professional, platform-ready content with AI, media and brand intelligence.' },
  robots: { index: true, follow: true }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
