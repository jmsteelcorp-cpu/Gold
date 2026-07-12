import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession, prisma, fmt } from '@/lib/utils';
import { logoutUser } from '@/actions/actions';
import { PaymentLinkForm, ConfirmPaymentButton, OnboardAgentForm, MarkPaidButton } from './AdminActions';

const TABS = [
  ['overview', 'Overview'],
  ['payments', 'Payments'],
  ['job-orders', 'Job Orders'],
  ['agents', 'Agents'],
  ['ledger', 'Ledger'],
] as const;

function ChartRow({ label, val, max, money }: { label: string; val: number; max: number; money?: boolean }) {
  return (
    <div className="mb-2.5">
      <div className="mb-1.5 flex justify-between text-[11.5px] font-semibold text-navy">
        <span>{label}</span>
        <span>{money ? fmt(val) : val}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-gradient-to-r from-gold-light to-gold" style={{ width: `${(val / max) * 100}%` }} />
      </div>
    </div>
  );
}

export default async function AdminDashboardPage({ searchParams }: { searchParams: { tab?: string } }) {
  const session = getSession();
  if (!session || session.role !== 'admin') redirect('/admin/login');
  const tab = searchParams.tab || 'overview';

  return (
    <div className="page-fade pb-10">
      <div className="flex items-center gap-3 bg-navy px-4 py-3.5 text-white">
        <Link href="/" className="flex h-8.5 w-8.5 h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-white/10 text-lg">⌂</Link>
        <div className="font-display font-semibold text-[16px]">Admin · {TABS.find((t) => t[0] === tab)?.[1]}</div>
        <div className="flex-1" />
        <form action={logoutUser}>
          <button type="submit" className="mr-2 text-[10.5px] font-semibold text-white/70 underline">Log out</button>
        </form>
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10.5px] font-bold text-gold-light">Admin</span>
      </div>

      <div className="px-5 pt-4">
        <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar">
          {TABS.map(([key, label]) => (
            <Link
              key={key}
              href={`/admin/dashboard?tab=${key}`}
              className={`whitespace-nowrap rounded-[11px] border px-3 py-2.5 text-[12px] font-bold ${
                tab === key ? 'border-navy bg-navy text-white' : 'border-line bg-white text-muted'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {tab === 'overview' && <OverviewTab />}
        {tab === 'payments' && <PaymentsTab />}
        {tab === 'job-orders' && <JobOrdersTab />}
        {tab === 'agents' && <AgentsTab />}
        {tab === 'ledger' && <LedgerTab />}
      </div>
    </div>
  );
}

async function OverviewTab() {
  const [ledger, jobOrders, agents, applications] = await Promise.all([
    prisma.ledgerEntry.findMany(),
    prisma.jobOrder.findMany(),
    prisma.agent.findMany(),
    prisma.application.findMany(),
  ]);

  const revenue = ledger.filter((l) => l.type === 'payment').reduce((s, l) => s + l.amount, 0);
  const pending = jobOrders.filter((j) => j.docPhase === 'submitted').length;
  const owed = agents.reduce((s, a) => s + (a.payoutStatus === 'unpaid' ? a.earnings : 0), 0);

  const counts = { investor: 0, dependent: 0, valuation: 0 };
  jobOrders.forEach((j) => {
    if (j.kind === 'valuation') counts.valuation++;
    else counts[j.relationship === 'investor' ? 'investor' : 'dependent']++;
  });
  const max = Math.max(1, counts.investor, counts.dependent, counts.valuation);

  const invoiced = applications.reduce((s, a) => s + a.amount, 0);
  const paid = applications.filter((a) => a.status === 'paid').reduce((s, a) => s + a.amount, 0);
  const allocated = jobOrders.reduce((s, j) => s + j.amount, 0);
  const fmax = Math.max(1, invoiced);

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl border border-line bg-white p-4"><div className="font-display text-[21px] font-semibold text-navy">{fmt(revenue)}</div><div className="text-[11px] text-muted mt-0.5">Total revenue</div></div>
        <div className="rounded-2xl border border-line bg-white p-4"><div className="font-display text-[21px] font-semibold text-navy">{pending}</div><div className="text-[11px] text-muted mt-0.5">Pending reviews</div></div>
        <div className="rounded-2xl border border-line bg-white p-4"><div className="font-display text-[21px] font-semibold text-navy">{jobOrders.length}</div><div className="text-[11px] text-muted mt-0.5">Total job orders</div></div>
        <div className="rounded-2xl border border-line bg-white p-4"><div className="font-display text-[21px] font-semibold text-navy">{fmt(owed)}</div><div className="text-[11px] text-muted mt-0.5">Commission owed</div></div>
      </div>

      <div className="mb-4 rounded-2xl border border-line bg-white p-4">
        <div className="mb-0.5 text-[13px] font-bold text-navy">Payment funnel</div>
        <div className="mb-3 text-[11px] text-muted">Where collected money is at, right now</div>
        <ChartRow label="Invoiced" val={invoiced} max={fmax} money />
        <ChartRow label="Paid & confirmed" val={paid} max={fmax} money />
        <ChartRow label="Allocated to job orders" val={allocated} max={fmax} money />
        {invoiced - paid > 0 && <div className="mt-1 text-[11px] text-muted">{fmt(invoiced - paid)} still awaiting payment confirmation.</div>}
      </div>

      <div className="rounded-2xl border border-line bg-white p-4">
        <div className="mb-3 text-[13px] font-bold text-navy">Job orders by type</div>
        <ChartRow label="Investor" val={counts.investor} max={max} />
        <ChartRow label="Dependent" val={counts.dependent} max={max} />
        <ChartRow label="Valuation" val={counts.valuation} max={max} />
      </div>
    </>
  );
}

async function PaymentsTab() {
  const invoices = await prisma.application.findMany({ where: { status: { not: 'paid' } }, orderBy: { createdAt: 'desc' } });
  if (invoices.length === 0) return <Empty icon="💳" text="No invoices awaiting action." />;
  return (
    <>
      {invoices.map((a) => (
        <div key={a.id} className="mb-3 rounded-2xl border border-line bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-navy">{a.invoiceNo} — {a.billingName || 'applicant'}</span>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${a.paymentLink ? 'bg-warnbg text-warn' : 'bg-[#E9EEF4] text-navy'}`}>{a.paymentLink ? 'Link Sent' : 'New'}</span>
          </div>
          <div className="mt-2 flex justify-between text-[13px]"><span className="text-muted">Type</span><span className="font-semibold text-navy">{a.type}</span></div>
          <div className="flex justify-between text-[13px]"><span className="text-muted">Amount</span><span className="font-semibold text-navy">{fmt(a.amount)}</span></div>
          {a.agentCode && <div className="flex justify-between text-[13px]"><span className="text-muted">Agent</span><span className="font-semibold text-navy">{a.agentCode} ({fmt(a.commission)})</span></div>}
          {!a.paymentLink ? (
            <PaymentLinkForm applicationId={a.id} />
          ) : (
            <>
              <div className="mt-2 break-all text-[11px] text-muted">{a.paymentLink}</div>
              <ConfirmPaymentButton applicationId={a.id} />
            </>
          )}
        </div>
      ))}
    </>
  );
}

async function JobOrdersTab() {
  const jobOrders = await prisma.jobOrder.findMany({ orderBy: { createdAt: 'desc' } });
  if (jobOrders.length === 0) return <Empty icon="🗂️" text="No job orders yet." />;
  return (
    <>
      {jobOrders.map((j) => {
        const badge =
          j.docPhase === 'verified' ? 'bg-okgreenbg text-okgreen' : j.docPhase === 'needs_reupload' ? 'bg-badbg text-bad' : j.docPhase === 'submitted' ? 'bg-warnbg text-warn' : 'bg-[#E9EEF4] text-navy';
        return (
          <Link key={j.id} href={`/admin/job-orders/${j.id}`} className="mb-2.5 block rounded-2xl border border-line bg-white p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13.5px] font-bold text-navy">{j.holderName}</span>
              <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${badge}`}>{j.docPhase.replace('_', ' ')}</span>
            </div>
            <div className="mt-1 text-[11px] text-muted">{j.jobOrderNumber} · {j.kind === 'valuation' ? 'Valuation' : j.relationship || 'Investor'} · {fmt(j.amount)}</div>
          </Link>
        );
      })}
    </>
  );
}

async function AgentsTab() {
  const agents = await prisma.agent.findMany({ orderBy: { createdAt: 'desc' } });
  return (
    <>
      <div className="mb-4">
        <OnboardAgentForm />
      </div>
      <h3 className="mb-2.5 text-[13.5px] font-semibold text-navy">Onboarded agents</h3>
      {agents.map((a) => (
        <div key={a.agentNo} className="mb-2.5 rounded-2xl border border-line bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="font-display text-[16px] font-semibold text-navy">{a.agentNo}</span>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${a.payoutStatus === 'paid' ? 'bg-okgreenbg text-okgreen' : 'bg-warnbg text-warn'}`}>{a.payoutStatus}</span>
          </div>
          <div className="mt-2 space-y-1 text-[13px]">
            <div className="flex justify-between"><span className="text-muted">Agent</span><span className="font-semibold text-navy">{a.agentName}</span></div>
            <div className="flex justify-between"><span className="text-muted">Contact</span><span className="font-semibold text-navy">{a.contact || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted">Commission</span><span className="font-semibold text-navy">{a.commissionType === 'percentage' ? `${a.commissionValue}%` : fmt(a.commissionValue)}</span></div>
            <div className="flex justify-between"><span className="text-muted">Codes used</span><span className="font-semibold text-navy">{a.uses}</span></div>
            <div className="flex justify-between"><span className="text-muted">Earnings owed</span><span className="font-semibold text-navy">{fmt(a.earnings)}</span></div>
          </div>
          {a.earnings > 0 && a.payoutStatus === 'unpaid' && <MarkPaidButton agentNo={a.agentNo} />}
        </div>
      ))}
    </>
  );
}

async function LedgerTab() {
  const rows = await prisma.ledgerEntry.findMany({ orderBy: { createdAt: 'desc' } });
  const balance = rows.reduce((s, l) => s + l.amount, 0);
  return (
    <>
      <div className="mb-4 rounded-2xl border border-line bg-white p-4">
        <div className="flex justify-between"><span className="font-bold text-navy">Net balance</span><span className="text-[16px] font-bold text-navy">{fmt(balance)}</span></div>
      </div>
      {rows.length === 0 && <Empty icon="📒" text="No transactions yet." />}
      {rows.map((l) => (
        <div key={l.id} className="mb-2 flex items-center justify-between rounded-xl border border-line bg-white px-3.5 py-3">
          <div>
            <div className="text-[13px] font-semibold text-navy">{l.label}</div>
            <div className="text-[11px] text-muted">{l.ref}</div>
          </div>
          <div className={`text-[13px] font-bold ${l.amount >= 0 ? 'text-okgreen' : 'text-bad'}`}>
            {l.amount >= 0 ? '+' : ''}
            {fmt(l.amount)}
          </div>
        </div>
      ))}
    </>
  );
}

function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="py-14 text-center text-muted">
      <div className="mb-3 text-3xl">{icon}</div>
      {text}
    </div>
  );
}
