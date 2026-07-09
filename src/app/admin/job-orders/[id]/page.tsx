import { redirect } from 'next/navigation';
import { getSession, prisma, parseHistory } from '@/lib/utils';
import AdminJobOrderView from './AdminJobOrderView';

export default async function AdminJobOrderPage({ params }: { params: { id: string } }) {
  const session = getSession();
  if (!session || session.role !== 'admin') redirect('/admin/login');

  const jo = await prisma.jobOrder.findUnique({ where: { id: params.id }, include: { documents: true } });
  if (!jo) redirect('/admin/dashboard?tab=job-orders');

  return (
    <AdminJobOrderView
      jobOrder={{
        id: jo.id,
        jobOrderNumber: jo.jobOrderNumber,
        kind: jo.kind,
        holderName: jo.holderName,
        relationship: jo.relationship,
        amount: jo.amount,
        docPhase: jo.docPhase,
        dld: jo.dld,
        gdrfa: jo.gdrfa,
        medical: jo.medical,
        medicalDate: jo.medicalDate,
        biometric: jo.biometric,
        biometricDate: jo.biometricDate,
        emiratesId: jo.emiratesId,
        taskStatus: jo.taskStatus,
        valuationStage: jo.valuationStage,
        reportValue: jo.reportValue,
        reportNotes: jo.reportNotes,
        history: parseHistory(jo.historyJson),
      }}
      documents={jo.documents.map((d) => ({ id: d.id, type: d.type, status: d.status, comment: d.comment, ocrConfirmed: d.ocrConfirmed, fileName: d.fileName, fileData: d.fileData }))}
    />
  );
}
