import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";
import RemoteProvider from "@/components/RemoteProvider";
import NextTopLoader from "nextjs-toploader";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mito",
  description: "movement training service for badminton player",
  openGraph: {
    title: "Mito",
    description: "movement training service for badminton player",
  },
};

function wsUrl() {
  const apiHost = process.env.API_HOST ?? "http://localhost:8080";
  return apiHost.replace(/^http/, "ws") + "/remote";
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      <body className="min-h-full flex flex-col">
        <NextTopLoader color="#a3e635" height={3} showSpinner={false} shadow={false} />
        <RemoteProvider wsUrl={wsUrl()}>
          <Header />
          <div className="flex flex-1 flex-col">{children}</div>
        </RemoteProvider>
      </body>
    </html>
  );
}
