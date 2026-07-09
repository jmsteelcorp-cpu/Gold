import { redirect } from 'next/navigation';
import { getSession, prisma, timeAgo } from '@/lib/utils';
import { markNotificationsRead } from '@/actions/actions';
import { TopBar, BottomNav } from '@/components/ui';

export default async function NotificationsPage() {
  const session = getSession();
  if (!session || session.role !== 'user') redirect('/login');

  const items = await prisma.notification.findMany({ where: { userId: session.id }, orderBy: { createdAt: 'desc' } });
  await markNotificationsRead();

  return (
    <div className="page-fade pb-28">
      <TopBar title="Notifications" />
      <div className="px-5 pt-4">
        {items.length === 0 && <div className="py-14 text-center text-muted"><div className="mb-3 text-3xl">🔔</div>No notifications yet.</div>}
        {items.map((n) => (
          <div key={n.id} className="mb-2.5 rounded-2xl border border-line bg-white p-4">
            <div className="text-[13px] font-semibold text-navy">{n.message}</div>
            <div className="mt-1 text-[11px] text-muted">{timeAgo(n.createdAt.toISOString())}</div>
          </div>
        ))}
      </div>
      <BottomNav unread={0} />
    </div>
  );
}
