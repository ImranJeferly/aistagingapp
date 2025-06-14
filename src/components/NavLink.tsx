interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export default function NavLink({ href, children, className = '' }: NavLinkProps) {
  return (
    <a 
      href={href} 
      className={`text-gray-600 hover:text-gray-900 transition-all duration-200 relative group ${className}`}
    >
      {children}
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-900 transition-all duration-200 group-hover:w-full"></span>
    </a>
  );
}
