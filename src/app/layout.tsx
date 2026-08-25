import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'D-Connect | Official Multi-Account Discord Hub',
  description:
    'Connect, manage, and monitor all your Discord accounts securely with official Discord OAuth2 and AES-256-GCM encryption.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0A0A0C] text-[#F3F4F6] antialiased">
        {children}
      </body>
    </html>
  );
}
