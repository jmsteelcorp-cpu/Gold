import { redirect } from 'next/navigation';
import { getSession, prisma, parseHistory } from '@/lib/utils';
import JobOrderView from './JobOrderView';

export default async function JobOrderDetailPage({ params }: { params: { jobOrderId: string } }) {
  const session = getSession();
  if (!session || session.role !== 'user') redirect('/login');

  const jo = await prisma.jobOrder.findUnique({
    where: { id: params.jobOrderId },
    include: { documents: true, application: true },
  });
  if (!jo || jo.application.userId !== session.id) redirect('/dashboard');

  return (
    <JobOrderView
      jobOrder={{
        id: jo.id,
        jobOrderNumber: jo.jobOrderNumber,
        kind: jo.kind,
        holderName: jo.holderName,
        relationship: jo.relationship,
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
        slaDays: jo.slaDays,
        createdAt: jo.createdAt.toISOString(),
        history: parseHistory(jo.historyJson),
      }}
      documents={jo.documents.map((d) => ({ id: d.id, type: d.type, status: d.status, comment: d.comment, ocrConfirmed: d.ocrConfirmed, fileName: d.fileName }))}
    />
  );
}
