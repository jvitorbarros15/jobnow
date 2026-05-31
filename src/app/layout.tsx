import type { Metadata } from "next"
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { AgentSearchProvider } from "@/lib/contexts/AgentSearchContext"
import AgentSearchNotification from "@/components/providers/AgentSearchNotification"

const display = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-space-grotesk", display: "swap" })
const sans = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" })

export const metadata: Metadata = {
  title: "JobNow",
  description: "AI-powered job search command center",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <AgentSearchProvider>
          {children}
          <AgentSearchNotification />
        </AgentSearchProvider>
      </body>
    </html>
  )
}
