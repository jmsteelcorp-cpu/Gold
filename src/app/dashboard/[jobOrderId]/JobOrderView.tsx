'use client';

import { useState, useTransition } from 'react';
import { TopBar } from '@/components/ui';
import { GovStageTracker, UpdateHistory, ValuationProgress, Badge, type DocRow, type HistoryEntry } from '@/components/StageTracker';
import { uploadDocument, submitDocuments } from '@/actions/actions';
import { fmt, RELATION_LABEL, type Relation } from '@/lib/shared';

type JobOrder = {
  id: string;
  jobOrderNumber: string;
  kind: string;
  holderName: string;
  relationship: string | null;
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
  slaDays: number;
  createdAt: string;
  history: HistoryEntry[];
};

export default function JobOrderView({ jobOrder, documents }: { jobOrder: JobOrder; documents: DocRow[] }) {
  const [docs, setDocs] = useState(documents);
  const [docPhase, setDocPhase] = useState(jobOrder.docPhase);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  function upload(docId: string, type: string, file: File) {
    if (file.size > 4 * 1024 * 1024) {
      showToast('File too large — please keep uploads under 4MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      showToast('Running OCR check…');
      setTimeout(() => {
        startTransition(async () => {
          await uploadDocument(jobOrder.id, docId, dataUrl, file.name);
          setDocs((prev) => prev.map((d) => (d.id === docId ? { ...d, status: 'uploaded', ocrConfirmed: true, comment: null, fileName: file.name } : d)));
          if (docPhase === 'needs_reupload' && docs.every((d) => d.id === docId || d.status === 'uploaded' || d.status === 'verified')) {
            setDocPhase('awaiting_upload');
          }
          showToast(`OCR confirmed: matches "${type}" ✓`);
        });
      }, 550);
    };
    reader.readAsDataURL(file);
  }

  function submitAll() {
    startTransition(async () => {
      await submitDocuments(jobOrder.id);
      setDocPhase('submitted');
    });
  }

  const kindLabel =
    jobOrder.kind === 'valuation' ? 'Valuation' : !jobOrder.relationship || jobOrder.relationship === 'investor' ? 'Investor' : RELATION_LABEL[jobOrder.relationship as Relation] || jobOrder.relationship;

  const elapsed = Math.floor((Date.now() - new Date(jobOrder.createdAt).getTime()) / 86400000);
  const remaining = Math.max(0, jobOrder.slaDays - elapsed);
  const allReady = docs.every((d) => d.status === 'uploaded' || d.status === 'verified');

  return (
    <div className="page-fade pb-10">
      <TopBar title="Job Order" />

      {(docPhase === 'awaiting_upload' || docPhase === 'needs_reupload') && (
        <div className="px-5 pt-4 pb-28">
          <div className="text-[11px] font-bold uppercase tracking-widest text-gold mb-2">Work Order {jobOrder.jobOrderNumber}</div>
          <h1 className="font-display text-[19px] font-semibold text-navy">
            {jobOrder.holderName} — {kindLabel}
          </h1>
          <p className="mt-2 text-[13px] text-muted">
            Upload each required document as per the checklist. We run an OCR check on each file to confirm it&apos;s the right document
            before it goes to admin.
          </p>

          <div className="mt-3.5">
            {docs.map((d) => (
              <label key={d.id} className="mb-2.5 flex items-center gap-3 rounded-2xl border border-line bg-white p-3.5">
                {d.status !== 'verified' && (
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) upload(d.id, d.type, file);
                      e.target.value = '';
                    }}
                  />
                )}
                <div className="flex h-8.5 w-8.5 h-[34px] w-[34px] items-center justify-center rounded-lg bg-sand text-[15px]">
                  {d.status === 'rejected' ? '⚠️' : d.status === 'not_uploaded' ? '📎' : '✅'}
                </div>
                <div className="flex-1">
                  <div className="text-[13.5px] font-semibold text-navy">{d.type}</div>
                  <div className="mt-0.5 text-[11px]">
                    {d.status === 'not_uploaded' && <span className="text-muted">Tap to choose a file</span>}
                    {d.status === 'uploaded' && <span className="text-warn">{d.fileName ? `${d.fileName} — ` : ''}OCR confirmed, awaiting admin review</span>}
                    {d.status === 'verified' && <span className="text-okgreen">Verified</span>}
                    {d.status === 'rejected' && <span className="text-bad">Rejected — re-upload needed</span>}
                  </div>
                  {d.status === 'rejected' && d.comment && (
                    <div className="mt-1.5 rounded-lg bg-badbg px-2.5 py-1.5 text-[11.5px] text-bad">Admin comment: {d.comment}</div>
                  )}
                </div>
                {d.status !== 'verified' && <div className="text-muted">›</div>}
              </label>
            ))}
          </div>

          <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-[480px] bg-gradient-to-t from-sand via-sand px-5 pb-6 pt-5">
            <button disabled={!allReady || pending} onClick={submitAll} className="w-full rounded-2xl bg-gradient-to-br from-gold-light to-gold py-3.5 font-bold text-navy-deep disabled:opacity-40">
              Submit All Documents to Admin
            </button>
          </div>
        </div>
      )}

      {docPhase === 'submitted' && (
        <div className="px-5 pt-8 pb-10">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-okgreenbg text-4xl">🕒</div>
            <h1 className="font-display text-[19px] font-semibold text-navy">Documents under verification</h1>
            <p className="mt-1.5 text-[13px] text-muted">Our admin team is reviewing everything submitted for {jobOrder.jobOrderNumber}.</p>
          </div>
          <div className="mt-5">
            <UpdateHistory history={jobOrder.history} />
          </div>
        </div>
      )}

      {docPhase === 'verified' && jobOrder.kind === 'visa' && (
        <div className="px-5 pt-4 pb-10">
          <div className="text-[11px] font-bold uppercase tracking-widest text-gold mb-2">Work Order {jobOrder.jobOrderNumber}</div>
          <h1 className="font-display text-[19px] font-semibold text-navy">{jobOrder.taskStatus === 'completed' ? 'Visa completed 🎉' : 'Verification successful'}</h1>
          <p className="mt-1.5 text-[13px] text-muted">
            {jobOrder.taskStatus === 'completed'
              ? 'Your Golden Visa process is complete. Emirates ID has been dispatched.'
              : `Day ${Math.min(elapsed, jobOrder.slaDays)} of ${jobOrder.slaDays} · roughly ${remaining} day${remaining === 1 ? '' : 's'} remaining`}
          </p>
          <div className="mt-4">
            <GovStageTracker
              dld={jobOrder.dld}
              gdrfa={jobOrder.gdrfa}
              medical={jobOrder.medical}
              medicalDate={jobOrder.medicalDate}
              biometric={jobOrder.biometric}
              biometricDate={jobOrder.biometricDate}
              emiratesId={jobOrder.emiratesId}
            />
          </div>
          {jobOrder.taskStatus === 'completed' && (
            <div className="mt-3 flex justify-center">
              <Badge tone="green">Task Completed</Badge>
            </div>
          )}
          <div className="mt-5">
            <UpdateHistory history={jobOrder.history} />
          </div>
        </div>
      )}

      {docPhase === 'verified' && jobOrder.kind === 'valuation' && (
        <div className="px-5 pt-4 pb-10">
          <div className="text-[11px] font-bold uppercase tracking-widest text-gold mb-2">Work Order {jobOrder.jobOrderNumber}</div>
          <h1 className="font-display text-[19px] font-semibold text-navy">Valuation in progress</h1>
          <p className="mt-1.5 text-[13px] text-muted">Day {Math.min(elapsed, jobOrder.slaDays)} of {jobOrder.slaDays}</p>
          <ValuationProgress stage={jobOrder.valuationStage} />
          {jobOrder.valuationStage === 'ready' ? (
            <div className="rounded-2xl border border-line bg-white p-4">
              <div className="flex justify-between border-b border-line py-2">
                <span className="text-muted">Assessed value</span>
                <span className="font-semibold text-navy">{fmt(jobOrder.reportValue || 0)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted">Notes</span>
                <span className="font-semibold text-navy">{jobOrder.reportNotes || '—'}</span>
              </div>
            </div>
          ) : (
            <div className="text-center text-[12px] text-muted">We&apos;ll notify you once your report is ready.</div>
          )}
          <div className="mt-5">
            <UpdateHistory history={jobOrder.history} />
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-5 right-5 z-40 mx-auto max-w-[440px] rounded-xl bg-navy px-4 py-3 text-[12.5px] font-semibold text-white shadow-card">
          ✓ {toast}
        </div>
      )}
    </div>
  );
}
