import { redirect } from 'next/navigation';
import { getSession, prisma } from '@/lib/utils';
import PaymentForm from './PaymentForm';

export default async function PaymentPage({ params }: { params: { id: string } }) {
  const session = getSession();
  if (!session || session.role !== 'user') redirect('/login');

  const app = await prisma.application.findUnique({ where: { id: params.id } });
  if (!app || app.userId !== session.id) redirect('/dashboard');

  return (
    <PaymentForm
      applicationId={app.id}
      invoiceNo={app.invoiceNo}
      amount={app.amount}
      status={app.status}
      paymentLink={app.paymentLink}
      commission={app.commission}
      agentCode={app.agentCode}
    />
  );
}
