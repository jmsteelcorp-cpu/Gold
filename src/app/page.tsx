import Link from 'next/link';
import { getSession, PRICES, fmt, prisma } from '@/lib/utils';
import { Logo, TiltCard, TestimonialMarquee, TrustBadges, BottomNav } from '@/components/ui';

export default async function HomePage() {
  const session = getSession();
  let unread = 0;
  if (session?.role === 'user') {
    unread = await prisma.notification.count({ where: { userId: session.id, read: false } });
  }

  return (
    <div className="page-fade pb-28">
      <div className="flex items-center justify-between px-4 py-3.5 bg-navy text-white">
        <Logo size={30} dark />
        {session?.role === 'user' && (
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10.5px] font-bold text-gold-light">{session.label.split('@')[0]}</span>
        )}
      </div>

      {/* HERO — 3D tilt stamp card over a navy gradient */}
      <div className="relative mx-5 mt-4 overflow-hidden rounded-[20px] bg-gradient-to-br from-navy-deep to-navy px-6 py-7">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #fff 0 2px, transparent 2px 22px), repeating-linear-gradient(-45deg, #fff 0 2px, transparent 2px 22px)',
          }}
        />
        <h1 className="relative max-w-[220px] font-display text-[25px] font-semibold leading-tight text-white">
          Your Golden Pass to <span className="text-gold-light">UAE Success</span>
        </h1>
        <p className="relative mt-2.5 max-w-[250px] text-[13px] text-white/70">
          Investor & dependent Golden Visas, plus independent property valuations — guided, verified, and fast.
        </p>

        <TiltCard className="absolute right-5 top-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-gold-light">
            <span className="text-center text-[8.5px] font-bold leading-tight tracking-wide text-gold-light">
              GOLDEN
              <br />
              PASS
            </span>
          </div>
        </TiltCard>
      </div>

      <div className="px-5 pt-5">
        <h3 className="mb-3 text-[14px] font-semibold text-navy">Our services</h3>

        <Link href="/apply/investor" className="mb-2.5 flex items-center justify-between rounded-[14px] border border-line bg-white p-4">
          <div>
            <h3 className="text-[14.5px] font-semibold text-navy">Investor Visa</h3>
            <div className="text-[12px] text-muted">Property owner · one-time</div>
          </div>
          <div className="text-[14px] font-bold text-navy">{fmt(PRICES.investor)}</div>
        </Link>
        <Link href="/apply/dependent" className="mb-2.5 flex items-center justify-between rounded-[14px] border border-line bg-white p-4">
          <div>
            <h3 className="text-[14.5px] font-semibold text-navy">Dependent Visa</h3>
            <div className="text-[12px] text-muted">Spouse, child, parent, staff</div>
          </div>
          <div className="text-right text-[14px] font-bold text-navy">
            {fmt(PRICES.dependent)} <span className="text-[11px] font-normal text-muted">/person</span>
          </div>
        </Link>
        <Link href="/apply/valuation" className="mb-4 flex items-center justify-between rounded-[14px] border border-line bg-white p-4">
          <div>
            <h3 className="text-[14.5px] font-semibold text-navy">Property Valuation</h3>
            <div className="text-[12px] text-muted">Independent report, standalone</div>
          </div>
          <div className="text-[14px] font-bold text-navy">{fmt(PRICES.valuation)}</div>
        </Link>

        <h3 className="mb-3 text-[14px] font-semibold text-navy">What applicants say</h3>
        <div className="-mx-5 mb-4">
          <TestimonialMarquee />
        </div>

        <div className="mb-4">
          <TrustBadges />
        </div>

        <Link href="/login" className="mb-2.5 flex items-center gap-3 rounded-[13px] border border-line bg-white p-3.5">
          <div className="flex h-8.5 w-8.5 h-[34px] w-[34px] items-center justify-center rounded-lg bg-sand text-[15px]">🔎</div>
          <div className="flex-1">
            <div className="text-[13.5px] font-semibold text-navy">Track my application</div>
            <div className="text-[11px] text-muted">Sign in with your email &amp; contact number</div>
          </div>
          <div className="text-muted">›</div>
        </Link>

        <div className="mt-4 text-center text-[12px] text-muted">
          Managing applications?{' '}
          <Link href="/admin/login" className="font-bold text-navy">
            Admin sign in
          </Link>{' '}
          ·{' '}
          <Link href="/agent/login" className="font-bold text-navy">
            Agent portal
          </Link>
        </div>
      </div>

      <BottomNav unread={unread} />
    </div>
  );
}
