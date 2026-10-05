'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dumbbell, BarChart2, Settings, History } from 'lucide-react';

const items = [
  { href: '/', label: 'ראשי', icon: Dumbbell },
  { href: '/history', label: 'היסטוריה', icon: History },
  { href: '/analytics', label: 'גרפים', icon: BarChart2 },
  { href: '/settings', label: 'הגדרות', icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();
  // The workout screen has its own bottom actions.
  if (pathname.startsWith('/workout')) return null;
  return (
    <nav
      className="fixed bottom-0 inset-x-0 bg-ink border-t border-line flex z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center pt-3 pb-2 gap-1 text-xs font-medium transition-colors ${
              active ? 'text-accent' : 'text-faint'
            }`}
          >
            <Icon size={22} strokeWidth={active ? 2.4 : 2} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
