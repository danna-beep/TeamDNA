'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/teamdna', label: 'Perfil' },
  { href: '/', label: 'Presenter' },
  { href: '/dashboard', label: 'Dashboard' },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(8, 5, 24, 0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        height: '56px',
      }}
    >
      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(109,40,217,0.5), rgba(37,99,235,0.4), transparent)' }}
      />

      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <span className="text-lg">🧬</span>
          <span
            className="font-mono font-bold text-white tracking-[0.15em] text-sm uppercase"
            style={{ letterSpacing: '0.15em' }}
          >
            TEAM DNA
          </span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-1.5 text-sm font-medium transition-all duration-200
                  ${active
                    ? 'text-white'
                    : 'text-white/40 hover:text-white/80'}`}
              >
                {link.label}
                {active && (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                    style={{ background: 'linear-gradient(90deg, #7c3aed, #6366f1)' }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
