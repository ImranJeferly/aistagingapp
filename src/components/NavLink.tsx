import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export default function NavLink({ href, children, className = '' }: NavLinkProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Check if it's an anchor link (starts with #) or a regular page link
  const isAnchorLink = href.startsWith('#');
  
  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isAnchorLink) {
      e.preventDefault();
      
      // If we're not on the landing page, go to landing page first with the anchor
      if (pathname !== '/') {
        router.push(`/${href}`);
        return;
      }
      
      // If we're on the landing page, scroll to the section
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const linkClasses = `text-gray-600 hover:text-gray-900 transition-all duration-200 relative group ${className}`;
  
  if (isAnchorLink) {
    return (
      <a 
        href={href} 
        onClick={handleAnchorClick}
        className={linkClasses}
      >
        {children}
        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-900 transition-all duration-200 group-hover:w-full"></span>
      </a>
    );
  }

  return (
    <Link 
      href={href} 
      className={linkClasses}
    >
      {children}
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-900 transition-all duration-200 group-hover:w-full"></span>
    </Link>
  );
}
