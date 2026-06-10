'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dumbbell, BarChart2, Settings, BookOpen } from 'lucide-react';

const items = [
  { href: '/', label: 'ראשי', icon: Dumbbell },
  { href: '/analytics', label: 'גרפים', icon: BarChart2 },
  { href: '/insights', label: 'תובנות', icon: BookOpen },
  { href: '/settings', label: 'הגדרות', icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 bg-gray-900 border-t border-gray-800 flex z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center pt-3 pb-2 gap-1 text-xs transition-colors ${
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
