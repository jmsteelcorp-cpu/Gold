'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState } from 'react';

/* ---------------------------------------------------------------
   LOGO
--------------------------------------------------------------- */
export function Logo({ size = 32, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 128 128" className="shrink-0">
        <defs>
          <linearGradient id="gp-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#E4C77E" />
            <stop offset="1" stopColor="#C89B3C" />
          </linearGradient>
        </defs>
        <rect width="128" height="128" rx="28" fill="#0E2A47" />
        <circle cx="64" cy="58" r="34" fill="none" stroke="url(#gp-grad)" strokeWidth="6" />
        <path d="M46 58 L58 70 L84 42" fill="none" stroke="url(#gp-grad)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={`font-display font-semibold tracking-tight ${dark ? 'text-white' : 'text-navy'}`} style={{ fontSize: size * 0.5 }}>
        Golden Pass
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------
   3D TILT CARD — pointer-driven perspective tilt, no dependencies
--------------------------------------------------------------- */
export function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setStyle({
      transform: `perspective(900px) rotateX(${py * -10}deg) rotateY(${px * 12}deg) translateZ(10px)`,
    });
  }
  function onLeave() {
    setStyle({ transform: 'perspective(900px) rotateX(0) rotateY(0) translateZ(0)' });
  }

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`tilt-card ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------
   RUNNING TESTIMONIAL MARQUEE
--------------------------------------------------------------- */
const TESTIMONIALS = [
  { quote: 'Work order created within a day of payment. Watching DLD and GDRFA update in real time removed all the guesswork.', name: 'Ahmed Al Marri', role: 'Investor Visa · Dubai Marina' },
  { quote: 'The OCR check on my title deed caught the exact valuation in seconds — no back and forth with a broker.', name: 'Sara Youssef', role: 'Investor Visa · Downtown Dubai' },
  { quote: 'Adding my parents as dependents was three taps once my own visa work order existed.', name: 'Liam Chen', role: 'Dependent Visa · Palm Jumeirah' },
  { quote: 'Property valuation report was ready faster than my bank needed it for the refinance.', name: 'Fatima Noor', role: 'Property Valuation · Business Bay' },
  { quote: 'Every government stage update hit my phone the moment admin logged it. Zero phone calls needed.', name: 'James Okafor', role: 'Investor Visa · JVC' },
];

export function TestimonialMarquee() {
  const items = [...TESTIMONIALS, ...TESTIMONIALS];
  return (
    <div className="overflow-hidden no-scrollbar py-1">
      <div className="marquee-track animate-marquee hover:[animation-play-state:paused]">
        {items.map((t, i) => (
          <div key={i} className="w-64 shrink-0 rounded-2xl border border-line bg-white p-4">
            <div className="text-[13px] font-semibold text-navy leading-snug">&ldquo;{t.quote}&rdquo;</div>
            <div className="text-[11px] text-muted mt-2">— {t.name}, {t.role}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   GOVERNMENT / ENTITY TRUST BADGES
   Decorative status strip only — see README for what real
   government-portal integration would require.
--------------------------------------------------------------- */
const ENTITIES = [
  { code: 'DLD', name: 'Dubai Land Dept.' },
  { code: 'GDRFA', name: 'Res. & Foreigners Affairs' },
  { code: 'ICP', name: 'Identity & Citizenship' },
  { code: 'MOHRE', name: 'Human Resources' },
];

export function TrustBadges() {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-gold mb-3">Process synced with</div>
      <div className="grid grid-cols-2 gap-3">
        {ENTITIES.map((e) => (
          <div key={e.code} className="flex items-center gap-2 rounded-xl bg-sand px-3 py-2.5">
            <div className="h-7 w-7 rounded-lg bg-navy text-gold-light text-[10px] font-extrabold flex items-center justify-center shrink-0">
              {e.code.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-navy leading-tight">{e.code}</div>
              <div className="text-[9.5px] text-muted leading-tight truncate">{e.name}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-muted mt-3">
        Work-order stages mirror each entity&apos;s process. Live status sync requires a formal API partnership with each authority.
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   TOP BAR — back button + title, used across inner pages
--------------------------------------------------------------- */
export function TopBar({ title, pill }: { title: string; pill?: string }) {
  return (
    <div className="sticky top-0 z-20 flex items-center gap-3 bg-navy px-4 py-3.5 text-white">
      <BackButton />
      <div className="font-display font-semibold text-[16px]">{title}</div>
      <div className="flex-1" />
      {pill && <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10.5px] font-bold text-gold-light">{pill}</span>}
    </div>
  );
}

export function BackButton() {
  return (
    <button
      onClick={() => history.back()}
      className="flex h-8.5 w-8.5 h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-white/10 text-lg hover:bg-white/20"
      aria-label="Back"
    >
      ‹
    </button>
  );
}

export function BottomNav({ unread = 0 }: { unread?: number }) {
  const pathname = usePathname();
  const items = [
    { href: '/', label: 'Home', icon: '⌂' },
    { href: '/apply/investor', label: 'Apply', icon: '＋' },
    { href: '/dashboard', label: 'Dashboard', icon: '▤' },
    { href: '/notifications', label: 'Alerts', icon: '🔔', badge: unread },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-[480px] safe-bottom">
      <div className="mx-3 mb-3 flex justify-between rounded-2xl border border-line bg-white/95 backdrop-blur px-2 py-2 shadow-card">
        {items.map((it) => {
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-semibold ${
                active ? 'text-navy' : 'text-muted'
              }`}
            >
              <span className="text-base leading-none">{it.icon}</span>
              {it.label}
              {!!it.badge && (
                <span className="absolute top-0 right-3 h-3.5 w-3.5 rounded-full bg-bad text-white text-[8px] flex items-center justify-center">
                  {it.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
