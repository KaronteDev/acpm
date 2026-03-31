import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ACPM — Altas Capacidades Project Manager',
  description: 'Plataforma de gestión de proyectos para equipos con Altas Capacidades Cognitivas',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg-0 text-text-0 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
