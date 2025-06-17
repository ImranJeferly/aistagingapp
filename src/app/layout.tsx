import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { Analytics } from "@vercel/analytics/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AI Staging App - Free AI Home Staging Tool for Real Estate",
    template: "%s | AI Staging App"
  },
  description: "Transform empty rooms into stunning spaces with our free AI staging platform. Professional home staging in 30 seconds. Perfect for real estate agents, property managers, and homeowners. No design experience required.",
  keywords: [
    "AI staging",
    "virtual staging",
    "home staging",
    "real estate staging",
    "property staging",
    "interior design AI",
    "real estate marketing",
    "virtual home staging",
    "AI interior design",
    "property visualization",
    "real estate photos",
    "staging software",
    "virtual furniture",
    "home staging app",
    "real estate agent tools"
  ],
  authors: [{ name: "AI Staging App" }],
  creator: "AI Staging App",
  publisher: "AI Staging App",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://aistagingapp.com",
    siteName: "AI Staging App",
    title: "AI Staging App - Free AI Home Staging Tool for Real Estate",
    description: "Transform empty rooms into stunning spaces with our free AI staging platform. Professional home staging in 30 seconds for real estate agents and homeowners.",
    images: [
      {
        url: "/og-image.png", // We'll need to create this
        width: 1200,
        height: 630,
        alt: "AI Staging App - Transform empty rooms with AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Staging App - Free AI Home Staging Tool",
    description: "Transform empty rooms into stunning spaces with AI staging. Professional results in 30 seconds. Perfect for real estate marketing.",
    images: ["/og-image.png"],
    creator: "@aistagingapp", // Update with your actual Twitter handle
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL || "https://aistagingapp.com",
  },
  category: "Technology",
  classification: "Real Estate Technology",
  icons: {
    icon: [
      { url: "/logo.png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  manifest: "/manifest.json", // We'll create this too
  verification: {
    google: "your-google-verification-code", // Add when you verify with Google Search Console
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Additional SEO and Performance Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for better performance */}
        <link rel="dns-prefetch" href="https://api.openai.com" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        
        {/* Canonical URL for SEO */}
        <link rel="canonical" href={process.env.NEXT_PUBLIC_APP_URL || "https://aistagingapp.com"} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
         <Analytics />
      </body>
    </html>
  );
}
