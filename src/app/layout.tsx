import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Consistency Dashboard — Minimal & Elegant Task System",
  description: "Track daily, monthly, and yearly tasks with automatic notification reminders and GitHub-style monochrome dot heatmap visualizer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Auto-recover from temporary chunk load timeouts / cold compilation delays
              window.addEventListener('error', function(e) {
                var msg = (e && e.message) || '';
                if (msg.indexOf('ChunkLoadError') !== -1 || msg.indexOf('Loading chunk') !== -1) {
                  var key = 'chunk_reload_' + window.location.pathname;
                  if (!sessionStorage.getItem(key)) {
                    sessionStorage.setItem(key, '1');
                    window.location.reload();
                  }
                }
              });
              window.addEventListener('load', function() {
                setTimeout(function() {
                  sessionStorage.removeItem('chunk_reload_' + window.location.pathname);
                }, 4000);
              });
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-dark-bg text-neutral-100 antialiased min-h-screen selection:bg-neutral-800 selection:text-white`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
