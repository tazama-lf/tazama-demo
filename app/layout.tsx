import "styles/tailwind.css"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Tazama Demo",
  description: "A Frontend Demo Platform for Tazama",
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
