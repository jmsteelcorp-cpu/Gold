import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession, prisma, fmt, timeAgo } from '@/lib/utils';
import { logoutUser } from '@/actions/actions';

export default async function AgentDashboardPage() {
  const session = getSession();
  if (!session || session.role !== 'agent') redirect('/agent/login');

  const agent = await prisma.agent.findUnique({ where: { agentNo: session.id } });
  if (!agent) redirect('/agent/login');

  const payouts = await prisma.ledgerEntry.findMany({
    where: { type: 'commission', ref: agent.agentNo },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="page-fade pb-10">
      <div className="flex items-center gap-3 bg-navy px-4 py-3.5 text-white">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gold-light to-gold text-[13px] font-extrabold text-navy-deep">AG</div>
        <div className="font-display font-semibold text-[16px]">Agent Dashboard</div>
        <div className="flex-1" />
        <form action={logoutUser}>
          <button type="submit" className="mr-2 text-[10.5px] font-semibold text-white/70 underline">Log out</button>
        </form>
        <Link href="/" className="flex h-8.5 w-8.5 h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-white/10 text-lg">⌂</Link>
      </div>

      <div className="px-5 pt-4">
        <div className="text-[11px] font-bold uppercase tracking-widest text-gold mb-1">{agent.agentNo}</div>
        <h1 className="font-display text-[20px] font-semibold text-navy">{agent.agentName}</h1>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl border border-line bg-white p-4">
            <div className="font-display text-[21px] font-semibold text-navy">{agent.uses}</div>
            <div className="text-[11px] text-muted mt-0.5">Codes used</div>
          </div>
          <div className="rounded-2xl border border-line bg-white p-4">
            <div className="font-display text-[21px] font-semibold text-navy">{fmt(agent.earnings)}</div>
            <div className="text-[11px] text-muted mt-0.5">Owed now</div>
          </div>
          <div className="rounded-2xl border border-line bg-white p-4">
            <div className="font-display text-[21px] font-semibold text-navy">{fmt(agent.totalPaid)}</div>
            <div className="text-[11px] text-muted mt-0.5">Total paid out</div>
          </div>
          <div className="rounded-2xl border border-line bg-white p-4">
            <div className="font-display text-[21px] font-semibold text-navy">
              {agent.commissionType === 'percentage' ? `${agent.commissionValue}%` : fmt(agent.commissionValue)}
            </div>
            <div className="text-[11px] text-muted mt-0.5">Commission rate</div>
          </div>
        </div>

        <h3 className="mb-2.5 mt-5 text-[13.5px] font-semibold text-navy">Payout history</h3>
        {payouts.length === 0 && <div className="py-10 text-center text-muted"><div className="mb-2 text-3xl">💰</div>No payouts yet.</div>}
        {payouts.map((p) => (
          <div key={p.id} className="mb-2 flex items-center justify-between rounded-xl border border-line bg-white px-3.5 py-3">
            <div>
              <div className="text-[13px] font-semibold text-navy">{p.label}</div>
              <div className="text-[11px] text-muted">{timeAgo(p.createdAt.toISOString())}</div>
            </div>
            <div className="text-[13px] font-bold text-bad">{fmt(p.amount)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
