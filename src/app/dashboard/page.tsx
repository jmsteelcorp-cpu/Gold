import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, prisma, fmt, RELATION_LABEL, type Relation } from '@/lib/utils';
import { logoutUser } from '@/actions/actions';
import { BottomNav, TopBar } from '@/components/ui';

export default async function DashboardPage() {
  const session = getSession();
  if (!session || session.role !== 'user') redirect('/login');

  const [applications, jobOrders, unread] = await Promise.all([
    prisma.application.findMany({ where: { userId: session.id }, orderBy: { createdAt: 'desc' } }),
    prisma.jobOrder.findMany({
      where: { application: { userId: session.id } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where: { userId: session.id, read: false } }),
  ]);

  const pendingPay = applications.filter((a) => a.status !== 'paid');

  function kindLabel(j: (typeof jobOrders)[number]) {
    if (j.kind === 'valuation') return 'Valuation';
    if (!j.relationship || j.relationship === 'investor') return 'Investor';
    return RELATION_LABEL[j.relationship as Relation] || j.relationship;
  }

  return (
    <div className="page-fade pb-28">
      <TopBar title="My Dashboard" />
      <div className="px-5 pt-3 text-right">
        <form action={logoutUser}>
          <button type="submit" className="text-[11.5px] font-semibold text-muted underline">Log out</button>
        </form>
      </div>
      <div className="px-5">
        {pendingPay.map((a) => (
          <div key={a.id} className="mb-3 rounded-2xl border border-gold bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-[13.5px] font-semibold text-muted">Invoice {a.invoiceNo}</span>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${a.paymentLink ? 'bg-warnbg text-warn' : 'bg-[#E9EEF4] text-navy'}`}>
                {a.status === 'invoice_created' ? 'Awaiting Payment Link' : a.paymentLink ? 'Payment Link Ready' : 'Preparing Link'}
              </span>
            </div>
            <div className="mt-2 flex justify-between text-[13.5px]">
              <span className="text-muted">Amount</span>
              <span className="font-semibold text-navy">{fmt(a.amount)}</span>
            </div>
            {a.paymentLink ? (
              <a href={a.paymentLink} target="_blank" rel="noreferrer" className="mt-2.5 block w-full rounded-xl bg-gradient-to-br from-gold-light to-gold py-2.5 text-center text-[13px] font-bold text-navy-deep">
                Pay Now
              </a>
            ) : (
              <div className="mt-2 text-[11px] text-muted">We&apos;ll notify you once the link is ready.</div>
            )}
          </div>
        ))}

        {jobOrders.length === 0 && pendingPay.length === 0 && (
          <div className="py-14 text-center text-muted">
            <div className="mb-3 text-3xl">📂</div>
            No applications yet.
            <div className="mt-4">
              <Link href="/" className="rounded-xl bg-navy px-5 py-2.5 text-[13px] font-bold text-white">
                Start an application
              </Link>
            </div>
          </div>
        )}

        {jobOrders.length > 0 && <h3 className="mb-2.5 mt-2 text-[14px] font-semibold text-navy">Job orders</h3>}
        {jobOrders.map((j) => {
          const elapsed = Math.floor((Date.now() - new Date(j.createdAt).getTime()) / 86400000);
          const badge =
            j.taskStatus === 'completed'
              ? 'bg-okgreenbg text-okgreen'
              : j.docPhase === 'verified'
              ? 'bg-warnbg text-warn'
              : j.docPhase === 'needs_reupload'
              ? 'bg-badbg text-bad'
              : j.docPhase === 'submitted'
              ? 'bg-warnbg text-warn'
              : 'bg-[#E9EEF4] text-navy';
          const label =
            j.taskStatus === 'completed'
              ? 'Completed'
              : { awaiting_upload: 'Upload Documents', submitted: 'Under Verification', needs_reupload: 'Needs Re-upload', verified: j.kind === 'valuation' ? 'In Progress' : 'In Processing' }[j.docPhase];
          return (
            <Link key={j.id} href={`/dashboard/${j.id}`} className="mb-2.5 block rounded-2xl border border-line bg-white p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[13.5px] font-bold text-navy">
                  {j.holderName} — {kindLabel(j)}
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap ${badge}`}>{label}</span>
              </div>
              <div className="mt-1 text-[11px] text-muted">
                {j.jobOrderNumber} · {fmt(j.amount)}
                {j.docPhase === 'verified' && j.taskStatus !== 'completed' ? ` · Day ${Math.min(elapsed, j.slaDays)} of ${j.slaDays}` : ''}
              </div>
            </Link>
          );
        })}
      </div>
      <BottomNav unread={unread} />
    </div>
  );
}
