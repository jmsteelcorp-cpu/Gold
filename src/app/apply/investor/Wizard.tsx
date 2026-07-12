'use client';

import { useState, useTransition } from 'react';
import { TopBar } from '@/components/ui';
import { ocrCheck } from '@/actions/actions';
import { createApplication } from '@/actions/actions';
import { PRICES, fmt, RELATIONS, RELATION_LABEL, RELATION_DOC, investorDocsFor, type Relation, type OcrResult } from '@/lib/shared';

type Dep = { relation: Relation | '' };

export default function InvestorWizard() {
  const [step, setStep] = useState<'upload' | 'loading' | 'result' | 'deps' | 'summary'>('upload');
  const [deedFile, setDeedFile] = useState<string | null>(null);
  const [ocr, setOcr] = useState<OcrResult | null>(null);
  const [deps, setDeps] = useState<Dep[]>([]);
  const [pending, startTransition] = useTransition();

  async function runOcr() {
    setStep('loading');
    const result = await ocrCheck();
    setOcr(result);
    setStep('result');
  }

  function setDepCount(n: number) {
    n = Math.max(0, Math.min(6, n));
    const next = [...deps];
    while (next.length < n) next.push({ relation: '' });
    next.length = n;
    setDeps(next);
  }

  function submit() {
    startTransition(() => {
      createApplication({
        type: 'investor',
        ownership: ocr?.ownership,
        ocr: ocr || undefined,
        deps: deps.filter((d) => d.relation) as { relation: Relation }[],
      });
    });
  }

  const validDeps = deps.filter((d) => d.relation);
  const total = PRICES.investor + validDeps.length * PRICES.dependent;

  return (
    <div className="page-fade pb-10">
      <TopBar
        title="Investor Visa"
        pill={step === 'upload' ? '1 / 3' : step === 'result' ? '2 / 3' : step === 'deps' ? '3 / 3' : undefined}
      />

      {step === 'upload' && (
        <div className="px-5 pt-5">
          <div className="text-[11px] font-bold uppercase tracking-widest text-gold mb-2">Title deed</div>
          <h1 className="font-display text-[24px] font-semibold text-navy leading-tight">Upload Title Deed / Valuation</h1>
          <p className="mt-2 text-[13.5px] text-muted">
            We don&apos;t ask how the property is held — upload the deed and OCR reads it straight from the document.
          </p>

          {deedFile ? (
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-line bg-white p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sand text-sm">📄</div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-navy">{deedFile}</div>
                <div className="text-[11px] text-okgreen">Uploaded</div>
              </div>
              <button onClick={() => setDeedFile(null)} className="text-muted">✕</button>
            </div>
          ) : (
            <button
              onClick={() => setDeedFile(`Title_Deed_${Math.floor(Math.random() * 9000 + 1000)}.pdf`)}
              className="mt-5 w-full rounded-2xl border-2 border-dashed border-line bg-white py-6 text-center"
            >
              <div className="mx-auto mb-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-sand text-lg">⬆️</div>
              <div className="text-[13.5px] font-semibold text-navy">Choose file</div>
              <div className="mt-0.5 text-[11.5px] text-muted">PDF, JPG or PNG — device storage</div>
            </button>
          )}

          <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-[480px] bg-gradient-to-t from-sand via-sand px-5 pb-6 pt-5">
            <button
              disabled={!deedFile}
              onClick={runOcr}
              className="w-full rounded-2xl bg-gradient-to-br from-gold-light to-gold py-3.5 font-bold text-navy-deep disabled:opacity-40"
            >
              Check Eligibility (Run OCR)
            </button>
          </div>
        </div>
      )}

      {step === 'loading' && (
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <div className="mb-5 h-12 w-12 animate-spin rounded-full border-4 border-line border-t-gold" />
          <div className="text-[14.5px] font-bold text-navy">Running OCR on your document…</div>
          <div className="mt-1.5 text-[12px] text-muted">Extracting value, ownership &amp; project details</div>
        </div>
      )}

      {step === 'result' && ocr && (
        <div className="px-5 pt-2">
          <div className="pt-4 text-center">
            <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full text-4xl ${ocr.eligible ? 'bg-okgreenbg' : 'bg-badbg'}`}>
              {ocr.eligible ? '✅' : '⚠️'}
            </div>
            <h1 className="font-display text-[20px] font-semibold text-navy">{ocr.eligible ? "You're eligible" : 'Below minimum value'}</h1>
            <p className="mt-1.5 text-[13.5px] text-muted">
              {ocr.eligible
                ? 'Property value meets the 2,000,000 AED minimum for the Investor Golden Visa.'
                : 'Minimum required is 2,000,000 AED. You may re-upload a different valuation.'}
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-okgreen bg-okgreenbg p-4">
            <div className="mb-1.5 text-[12.5px] font-bold text-okgreen">✓ Document cross-checked</div>
            <div className="text-[12px] text-[#2c6b48]">
              Ownership type read directly from the deed: <b>{ocr.ownershipLabel}</b>. No manual selection needed — your document
              checklist below is built from this result.
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-line bg-white p-4 text-[13.5px]">
            {[
              ['OCR value', fmt(ocr.value)],
              ['Name', 'Applicant'],
              ['Type', ocr.type],
              ['Developer', ocr.developer],
              ['Project', ocr.project],
              ['Purchase date', ocr.purchaseDate],
              ['Ownership', ocr.ownershipLabel],
              ['Mortgage', ocr.mortgage],
              ['Off-plan / Ready', ocr.offplan],
              ['Payment plan', ocr.paymentPlan],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-line py-2.5 last:border-0">
                <span className="text-muted">{k}</span>
                <span className="font-semibold text-navy">{v}</span>
              </div>
            ))}
          </div>

          {ocr.eligible && (
            <>
              <h2 className="my-3 text-[14px] font-semibold text-navy">Documents you&apos;ll need</h2>
              <div className="rounded-2xl border border-line bg-white p-4">
                {investorDocsFor(ocr.ownership).map((d) => (
                  <div key={d} className="border-b border-line py-2.5 text-[13.5px] text-muted last:border-0">
                    {d}
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-[480px] bg-gradient-to-t from-sand via-sand px-5 pb-6 pt-5">
            {ocr.eligible ? (
              <button onClick={() => setStep('deps')} className="w-full rounded-2xl bg-gradient-to-br from-gold-light to-gold py-3.5 font-bold text-navy-deep">
                Continue
              </button>
            ) : (
              <button onClick={() => setStep('upload')} className="w-full rounded-2xl bg-navy py-3.5 font-bold text-white">
                Re-upload Document
              </button>
            )}
          </div>
        </div>
      )}

      {step === 'deps' && (
        <div className="px-5 pt-5 pb-24">
          <div className="text-[11px] font-bold uppercase tracking-widest text-gold mb-2">Optional</div>
          <h1 className="font-display text-[24px] font-semibold text-navy">Sponsor dependents?</h1>
          <p className="mt-2 text-[13.5px] text-muted">Each dependent becomes its own work order at {fmt(PRICES.dependent)}.</p>

          <div className="mt-4">
            <label className="mb-1.5 block text-[12px] font-semibold text-navy">Number of dependents</label>
            <input
              type="number"
              min={0}
              max={6}
              value={deps.length}
              onChange={(e) => setDepCount(parseInt(e.target.value || '0'))}
              className="w-full rounded-[11px] border border-line px-3.5 py-3 text-[14px]"
            />
          </div>

          {deps.map((d, i) => (
            <div key={i} className="mt-3 rounded-2xl border border-line bg-white p-4">
              <label className="mb-1.5 block text-[12px] font-semibold text-navy">Dependent {i + 1} — relationship</label>
              <select
                value={d.relation}
                onChange={(e) => {
                  const next = [...deps];
                  next[i] = { relation: e.target.value as Relation };
                  setDeps(next);
                }}
                className="w-full rounded-[11px] border border-line px-3.5 py-3 text-[14px]"
              >
                <option value="">Select relationship</option>
                {RELATIONS.map((r) => (
                  <option key={r} value={r}>
                    {RELATION_LABEL[r]}
                  </option>
                ))}
              </select>
              {d.relation && (
                <div className="mt-2 text-[11px] text-muted">
                  Required: Passport (front/back/cover), Visa Copy, {RELATION_DOC[d.relation]}
                </div>
              )}
            </div>
          ))}

          <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-[480px] bg-gradient-to-t from-sand via-sand px-5 pb-6 pt-5">
            <button onClick={() => setStep('summary')} className="w-full rounded-2xl bg-gradient-to-br from-gold-light to-gold py-3.5 font-bold text-navy-deep">
              Continue to Summary
            </button>
          </div>
        </div>
      )}

      {step === 'summary' && (
        <div className="px-5 pt-5 pb-24">
          <h1 className="font-display text-[20px] font-semibold text-navy">Review your application</h1>
          <div className="mt-4 rounded-2xl border border-line bg-white p-4 text-[13.5px]">
            <div className="flex justify-between border-b border-line py-2.5">
              <span className="text-muted">Investor Visa</span>
              <span className="font-semibold text-navy">{fmt(PRICES.investor)}</span>
            </div>
            {validDeps.map((d, i) => (
              <div key={i} className="flex justify-between border-b border-line py-2.5">
                <span className="text-muted">Dependent — {RELATION_LABEL[d.relation as Relation]}</span>
                <span className="font-semibold text-navy">{fmt(PRICES.dependent)}</span>
              </div>
            ))}
            <div className="flex justify-between py-2.5">
              <span className="font-bold text-navy">Total</span>
              <span className="text-[15.5px] font-bold text-navy">{fmt(total)}</span>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-[480px] bg-gradient-to-t from-sand via-sand px-5 pb-6 pt-5">
            <button disabled={pending} onClick={submit} className="w-full rounded-2xl bg-gradient-to-br from-gold-light to-gold py-3.5 font-bold text-navy-deep disabled:opacity-60">
              {pending ? 'Creating invoice…' : 'Apply — Create Invoice'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
