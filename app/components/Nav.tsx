'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/teamdna', label: 'TeamDNA', emoji: '👤' },
  { href: '/', label: 'Presenter', emoji: '🎯' },
  { href: '/dashboard', label: 'Dashboard', emoji: '📊' },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(13, 10, 30, 0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧬</span>
          <span className="font-black text-white tracking-tight">Team DNA</span>
        </div>
        <div className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2
                ${pathname === link.href
                  ? 'bg-violet-500/25 text-violet-200 border border-violet-500/35'
                  : 'text-white/55 hover:text-white hover:bg-white/8'}`}
            >
              <span>{link.emoji}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
