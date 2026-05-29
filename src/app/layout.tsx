import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "JobMaker",
  description: "AI-powered job search co-pilot",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  )
}
