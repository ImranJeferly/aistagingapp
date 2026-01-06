import { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Blog | AI Staging App',
  description: 'Latest news, tips, and tutorials about virtual staging and interior design.',
};

export default function BlogsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FFFCF5]">
      <Navigation />
      {children}
      <Footer />
    </div>
  );
}
