import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Features",
  description: "Discover powerful AI staging features for real estate professionals. Instant staging, multiple design styles, high-quality results, and easy-to-use interface.",
  openGraph: {
    title: "Features - AI Staging App",
    description: "Discover powerful AI staging features for real estate professionals. Instant staging, multiple design styles, and professional results.",
    url: `${process.env.NEXT_PUBLIC_APP_URL}/features`,
  },
  twitter: {
    title: "Features - AI Staging App", 
    description: "Discover powerful AI staging features for real estate professionals. Instant staging, multiple design styles, and professional results.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
