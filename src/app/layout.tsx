import type { Metadata } from "next";
import { Patrick_Hand, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { Analytics } from "@vercel/analytics/next"

const bbhHegarty = Patrick_Hand({
  variable: "--font-patrick-hand",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://aistagingapp.com'),
  title: {
    default: "AI Staging App | Professional AI Home Staging for Real Estate",
    template: "%s | AI Staging App"
  },
  description: "Transform empty rooms into stunning spaces with AI. Professional home staging in 30 seconds. Free tier available for real estate agents, property managers, and homeowners.",
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
    title: "AI Staging App | Professional AI Home Staging for Real Estate",
    description: "Transform empty rooms into stunning spaces with AI. Professional home staging in 30 seconds for real estate agents and property managers.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AI Staging App - Professional AI home staging platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Staging App | Professional AI Home Staging",
    description: "Transform empty rooms into stunning spaces with AI. Professional home staging in 30 seconds for real estate marketing.",
    images: ["/og-image.png"],
    creator: "@aistagingapp",
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL || "https://aistagingapp.com",
  },
  category: "Technology",
  classification: "Real Estate Technology",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#3b82f6",
      },
    ],
  },
  manifest: "/manifest.json", // We'll create this too
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
        <meta name="apple-mobile-web-app-title" content="AI Staging" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch for better performance */}
        <link rel="dns-prefetch" href="https://api.openai.com" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        
        {/* Canonical URL for SEO */}
        <link rel="canonical" href={process.env.NEXT_PUBLIC_APP_URL || "https://aistagingapp.com"} />
        
        {/* Additional favicons and icons for better browser support */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#3b82f6" />

        {/* Organization Structured Data for Google Sitelinks */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "AI Staging App",
              "url": process.env.NEXT_PUBLIC_APP_URL || "https://aistagingapp.com",
              "logo": `${process.env.NEXT_PUBLIC_APP_URL || "https://aistagingapp.com"}/logo.png`,
              "description": "Professional AI home staging for real estate. Transform empty rooms into stunning spaces in seconds.",
              "sameAs": [
                // Add your social media URLs here when available
              ],
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": `${process.env.NEXT_PUBLIC_APP_URL || "https://aistagingapp.com"}/upload`
                },
                "query-input": "required name=search_term_string"
              },
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": process.env.NEXT_PUBLIC_APP_URL || "https://aistagingapp.com"
              }
            })
          }}
        />
      </head>
      <body
        className={`${bbhHegarty.variable} ${inter.variable} antialiased font-sans`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
         <Analytics />
      </body>
    </html>
  );
}
