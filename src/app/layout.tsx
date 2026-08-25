import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Discord Account Dashboard | Official Multi-Account Manager',
  description:
    'Securely manage and monitor multiple user-owned Discord accounts via official Discord OAuth2 and REST APIs.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#141517] text-[#F2F3F5] antialiased">
        {children}
      </body>
    </html>
  );
}
