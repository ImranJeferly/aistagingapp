import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Login - AI Staging App",
  description: "Sign in to your AI Staging App account. Access your dashboard to transform empty rooms with professional AI home staging for real estate marketing.",
  openGraph: {
    title: "Login - AI Staging App",
    description: "Sign in to your AI Staging App account. Access professional AI home staging tools for real estate marketing.",
    url: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
  },
  twitter: {
    title: "Login - AI Staging App",
    description: "Sign in to your AI Staging App account. Access professional AI home staging tools for real estate marketing.",
  },
  robots: {
    index: false, // Don't index login pages
    follow: false,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
