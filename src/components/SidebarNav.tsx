'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function SidebarNav() {
  const pathname = usePathname();

  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `px-3 py-2 text-sm font-medium rounded-md transition-colors w-full text-left flex items-center gap-2 ${
      isActive 
        ? 'bg-primary/10 text-primary !font-semibold' 
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    }`;
  };

  return (
    <div className="flex md:flex-col gap-1 items-start w-full">
      <Link href="/" className={getLinkClass('/')}>
        This Week
      </Link>
      <Link href="/timeline" className={getLinkClass('/timeline')}>
        Timeline
      </Link>
      <Link href="/insights" className={getLinkClass('/insights')}>
        Insights Map
      </Link>
      
      <div className="h-4 hidden md:block" /> {/* Spacer */}
      <span className="text-xs text-muted-foreground font-mono px-3 mb-1 hidden md:block mt-2 tracking-widest">
        EVOLUTION
      </span>
      <Link href="/year-review" className={getLinkClass('/year-review')}>
        Year in Curiosity
      </Link>
    </div>
  );
}
