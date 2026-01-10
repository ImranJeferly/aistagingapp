import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Sign Up - AI Staging App",
  description: "Create your free AI Staging App account. Get 5 free staged images and transform empty rooms with professional AI home staging for real estate marketing.",
  openGraph: {
    title: "Sign Up - AI Staging App",
    description: "Create your free AI Staging App account. Get 5 free staged images and transform empty rooms with professional AI home staging.",
    url: `${process.env.NEXT_PUBLIC_APP_URL}/register`,
  },
  twitter: {
    title: "Sign Up - AI Staging App",
    description: "Create your free AI Staging App account. Get 5 free staged images and transform empty rooms with professional AI home staging.",
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
