'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dumbbell, BarChart2, Settings } from 'lucide-react';

const items = [
  { href: '/', label: 'בית', icon: Dumbbell },
  { href: '/analytics', label: 'גרפים', icon: BarChart2 },
  { href: '/settings', label: 'הגדרות', icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-gray-900 border-t border-gray-800 flex safe-bottom z-50">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs transition-colors ${
              active ? 'text-blue-400' : 'text-gray-500'
            }`}
          >
            <Icon size={22} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
