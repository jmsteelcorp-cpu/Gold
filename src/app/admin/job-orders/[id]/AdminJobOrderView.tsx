'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar } from '@/components/ui';
import { UpdateHistory, Badge, type DocRow, type HistoryEntry } from '@/components/StageTracker';
import {
  reviewDocument,
  advanceStage,
  scheduleAppointment,
  completeAppointment,
  completeTask,
  setValuationStage,
  saveValuationReport,
} from '@/actions/actions';
import { fmt } from '@/lib/shared';

type JobOrder = {
  id: string;
  jobOrderNumber: string;
  kind: string;
  holderName: string;
  relationship: string | null;
  amount: number;
  docPhase: string;
  dld: string;
  gdrfa: string;
  medical: string;
  medicalDate: string | null;
  biometric: string;
  biometricDate: string | null;
  emiratesId: string;
  taskStatus: string;
  valuationStage: string | null;
  reportValue: number | null;
  reportNotes: string | null;
  history: HistoryEntry[];
};

const STAGE_OPTIONS: Record<string, string[]> = {
  dld: ['pending', 'applied', 'approved'],
  gdrfa: ['pending', 'applied', 'approved'],
  emiratesId: ['not_started', 'printing', 'courier'],
};

export default function AdminJobOrderView({ jobOrder, documents }: { jobOrder: JobOrder; documents: DocRow[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function verify(docId: string) {
    startTransition(async () => {
      await reviewDocument(jobOrder.id, docId, 'verify');
      router.refresh();
    });
  }
  function reject(docId: string, type: string) {
    const comment = window.prompt(`Rejection reason for "${type}":`, 'Image unclear, please rescan') || 'Please re-upload a clearer copy';
    startTransition(async () => {
      await reviewDocument(jobOrder.id, docId, 'reject', comment);
      router.refresh();
    });
  }
  function advance(field: 'dld' | 'gdrfa' | 'emiratesId', label: string) {
    startTransition(async () => {
      await advanceStage(jobOrder.id, field, label);
      router.refresh();
    });
  }
  function finish() {
    startTransition(async () => {
      await completeTask(jobOrder.id);
      router.refresh();
    });
  }

  const kindLabel = jobOrder.kind === 'valuation' ? 'Property Valuation' : jobOrder.relationship || 'Investor Visa';

  return (
    <div className="page-fade pb-10">
      <TopBar title="Job Order Review" />
      <div className="px-5 pt-4">
        <div className="text-[11px] font-bold uppercase tracking-widest text-gold mb-1">Work Order {jobOrder.jobOrderNumber}</div>
        <h1 className="font-display text-[19px] font-semibold text-navy">{jobOrder.holderName}</h1>
        <div className="mt-1 text-[13px] text-muted">{kindLabel} · {fmt(jobOrder.amount)}</div>

        <h3 className="mb-2.5 mt-4 text-[13.5px] font-semibold text-navy">Documents</h3>
        {documents.map((d) => (
          <div key={d.id} className="mb-2.5 rounded-2xl border border-line bg-white p-3.5">
            {d.status === 'verified' && (
              <div className="flex items-center gap-3"><span className="text-[15px]">✅</span><div><div className="text-[13px] font-semibold text-navy">{d.type}</div><div className="text-[11px] text-okgreen">Verified</div></div></div>
            )}
            {d.status === 'not_uploaded' && (
              <div className="flex items-center gap-3"><span className="text-[15px]">⏳</span><div><div className="text-[13px] font-semibold text-navy">{d.type}</div><div className="text-[11px] text-muted">Not uploaded yet</div></div></div>
            )}
            {(d.status === 'uploaded' || d.status === 'rejected') && (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-[15px]">📄</span>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold text-navy">{d.type}</div>
                    <div className={`text-[11px] ${d.status === 'rejected' ? 'text-bad' : 'text-warn'}`}>{d.status === 'rejected' ? 'Rejected' : 'OCR confirmed — awaiting review'}</div>
                  </div>
                  {d.fileData && (
                    <a href={d.fileData} download={d.fileName || d.type} target="_blank" rel="noreferrer" className="rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-bold text-navy">
                      View file
                    </a>
                  )}
                </div>
                {d.fileData?.startsWith('data:image') && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.fileData} alt={d.type} className="mt-2.5 max-h-40 w-full rounded-lg border border-line object-cover" />
                )}
                <div className="mt-2.5 flex gap-2.5">
                  <button disabled={pending} onClick={() => verify(d.id)} className="flex-1 rounded-lg bg-okgreenbg py-2 text-[12.5px] font-bold text-okgreen">Verify</button>
                  <button disabled={pending} onClick={() => reject(d.id, d.type)} className="flex-1 rounded-lg bg-badbg py-2 text-[12.5px] font-bold text-bad">Reject</button>
                </div>
              </>
            )}
          </div>
        ))}

        {jobOrder.docPhase === 'verified' && jobOrder.kind === 'visa' && (
          <VisaStageControls jobOrder={jobOrder} pending={pending} advance={advance} finish={finish} router={router} startTransition={startTransition} />
        )}
        {jobOrder.docPhase === 'verified' && jobOrder.kind === 'valuation' && (
          <ValuationStageControls jobOrder={jobOrder} router={router} />
        )}

        <UpdateHistory history={jobOrder.history} />
      </div>
    </div>
  );
}

function VisaStageControls({
  jobOrder,
  pending,
  advance,
  finish,
  router,
  startTransition,
}: {
  jobOrder: JobOrder;
  pending: boolean;
  advance: (f: 'dld' | 'gdrfa' | 'emiratesId', l: string) => void;
  finish: () => void;
  router: ReturnType<typeof useRouter>;
  startTransition: (callback: () => void | Promise<void>) => void;
}) {
  return (
    <>
      <h3 className="mb-2.5 mt-4 text-[13.5px] font-semibold text-navy">Government stages</h3>
      <div className="rounded-2xl border border-line bg-white p-4">
        <GovRow label="DLD Approval" field="dld" value={jobOrder.dld} onAdvance={() => advance('dld', 'DLD Approval')} pending={pending} />
        <GovRow label="GDRFA" field="gdrfa" value={jobOrder.gdrfa} onAdvance={() => advance('gdrfa', 'GDRFA')} pending={pending} />
        <ApptRow jobOrderId={jobOrder.id} label="Medical Test" field="medical" status={jobOrder.medical} date={jobOrder.medicalDate} router={router} />
        <ApptRow jobOrderId={jobOrder.id} label="Biometrics" field="biometric" status={jobOrder.biometric} date={jobOrder.biometricDate} router={router} />
        <GovRow label="Emirates ID" field="emiratesId" value={jobOrder.emiratesId} onAdvance={() => advance('emiratesId', 'Emirates ID')} pending={pending} />
      </div>
      {jobOrder.emiratesId === 'courier' && jobOrder.taskStatus !== 'completed' && (
        <button disabled={pending} onClick={finish} className="mt-3 w-full rounded-2xl bg-gradient-to-br from-gold-light to-gold py-3.5 font-bold text-navy-deep">
          Press Complete — Finish Task
        </button>
      )}
      {jobOrder.taskStatus === 'completed' && (
        <div className="mt-3 flex justify-center">
          <Badge tone="green">Task Completed</Badge>
        </div>
      )}
    </>
  );
}

function GovRow({ label, field, value, onAdvance, pending }: { label: string; field: string; value: string; onAdvance: () => void; pending: boolean }) {
  const options = STAGE_OPTIONS[field];
  const isLast = value === options[options.length - 1];
  return (
    <div className="flex items-center justify-between border-b border-line py-3 last:border-0">
      <div className="text-[13px] font-semibold text-navy">{label}</div>
      <div className="flex items-center gap-2">
        <Badge tone={isLast ? 'green' : 'gold'}>{value.replace('_', ' ')}</Badge>
        {!isLast && (
          <button disabled={pending} onClick={onAdvance} className="rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-bold text-navy">
            Advance
          </button>
        )}
      </div>
    </div>
  );
}

function ApptRow({
  jobOrderId,
  label,
  field,
  status,
  date,
  router,
}: {
  jobOrderId: string;
  label: string;
  field: 'medical' | 'biometric';
  status: string;
  date: string | null;
  router: ReturnType<typeof useRouter>;
}) {
  const [pickDate, setPickDate] = useState('');
  const [pending, startTransition] = useTransition();

  if (status === 'pending') {
    return (
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-line py-3 last:border-0">
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-navy">{label}</div>
          <div className="text-[11px] text-muted">Set an appointment date</div>
        </div>
        <div className="flex w-full gap-2">
          <input type="date" value={pickDate} onChange={(e) => setPickDate(e.target.value)} className="flex-1 rounded-lg border border-line px-2.5 py-2 text-[12.5px]" />
          <button
            disabled={pending || !pickDate}
            onClick={() => startTransition(async () => { await scheduleAppointment(jobOrderId, field, pickDate, label); router.refresh(); })}
            className="rounded-lg border border-line px-3 py-2 text-[11px] font-bold text-navy"
          >
            Schedule
          </button>
        </div>
      </div>
    );
  }
  if (status === 'scheduled') {
    return (
      <div className="flex items-center justify-between border-b border-line py-3 last:border-0">
        <div><div className="text-[13px] font-semibold text-navy">{label}</div><div className="text-[11px] text-muted">Appointment: {date}</div></div>
        <div className="flex items-center gap-2">
          <Badge tone="gold">Scheduled</Badge>
          <button
            disabled={pending}
            onClick={() => startTransition(async () => { await completeAppointment(jobOrderId, field, label); router.refresh(); })}
            className="rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-bold text-navy"
          >
            Mark Done
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between border-b border-line py-3 last:border-0">
      <div><div className="text-[13px] font-semibold text-navy">{label}</div>{date && <div className="text-[11px] text-muted">Completed on {date}</div>}</div>
      <Badge tone="green">Completed</Badge>
    </div>
  );
}

function ValuationStageControls({ jobOrder, router }: { jobOrder: JobOrder; router: ReturnType<typeof useRouter> }) {
  const steps = ['received', 'assessment', 'report_prep', 'ready'];
  const [value, setValue] = useState(jobOrder.reportValue?.toString() || '');
  const [notes, setNotes] = useState(jobOrder.reportNotes || '');
  const [pending, startTransition] = useTransition();

  return (
    <>
      <h3 className="mb-2.5 mt-4 text-[13.5px] font-semibold text-navy">Valuation stage</h3>
      <div className="rounded-2xl border border-line bg-white p-4">
        <div className="mb-3">
          <label className="mb-1.5 block text-[12px] font-semibold text-navy">Stage</label>
          <select
            defaultValue={jobOrder.valuationStage || 'received'}
            onChange={(e) => startTransition(async () => { await setValuationStage(jobOrder.id, e.target.value); router.refresh(); })}
            className="w-full rounded-[10px] border border-line px-3 py-2.5 text-[13px]"
          >
            {steps.map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="mb-1.5 block text-[12px] font-semibold text-navy">Report value (AED)</label>
          <input type="number" value={value} onChange={(e) => setValue(e.target.value)} className="w-full rounded-[10px] border border-line px-3 py-2.5 text-[13px]" />
        </div>
        <div className="mb-3">
          <label className="mb-1.5 block text-[12px] font-semibold text-navy">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-[10px] border border-line px-3 py-2.5 text-[13px]" rows={3} />
        </div>
        <button
          disabled={pending}
          onClick={() => startTransition(async () => { await saveValuationReport(jobOrder.id, Number(value || 0), notes); router.refresh(); })}
          className="w-full rounded-xl bg-navy py-2.5 text-[13px] font-bold text-white"
        >
          Save
        </button>
      </div>
    </>
  );
}
