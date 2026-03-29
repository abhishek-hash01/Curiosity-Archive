import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { AppWindow } from 'lucide-react';
import { DataControls } from '@/components/DataControls';
import { SidebarNav } from '@/components/SidebarNav';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'Curiosity Archive',
  description: 'A structured curiosity archive.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground`}
      >
        <div className="flex flex-col md:flex-row h-screen overflow-hidden">
          {/* Sidebar / Top Nav */}
          <nav className="flex md:flex-col justify-between p-4 md:w-64 border-b md:border-b-0 md:border-r border-border shrink-0">
            <div className="flex md:flex-col gap-6">
              <div className="flex items-center gap-2 px-2 py-1 mb-2">
                <AppWindow className="w-5 h-5 text-primary" />
                <span className="font-semibold tracking-tight hidden md:inline">Curiosity Archive</span>
              </div>
              
              <SidebarNav />
            </div>

            <div className="flex md:flex-col gap-2 mt-auto">
              <span className="text-xs text-muted-foreground font-mono px-3 mb-2 hidden md:block">DATA</span>
              <button
                // We must use a client component wrapper or onClick handler properly later,
                // but for now, we'll keep layout as a server component and make these client components.
                // Wait, export/import onClick needs to be client side. Let's extract DataControls.
                className="hidden"
              />
              <DataControls />
            </div>
          </nav>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
