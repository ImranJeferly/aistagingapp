import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Pricing",
  description: "Choose the perfect AI staging plan for your real estate business. Free tier with 5 images, Basic plan with 50 images/month, or Pro plan with unlimited staging.",
  openGraph: {
    title: "Pricing - AI Staging App",
    description: "Choose the perfect AI staging plan for your real estate business. Free tier available with professional staging options.",
    url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
  },
  twitter: {
    title: "Pricing - AI Staging App",
    description: "Choose the perfect AI staging plan for your real estate business. Free tier available with professional staging options.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
