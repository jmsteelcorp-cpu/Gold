'use client';

import { useState, useTransition } from 'react';
import { TopBar } from '@/components/ui';
import { createApplication } from '@/actions/actions';
import { PRICES, fmt, RELATIONS, RELATION_LABEL, RELATION_DOC, SPONSOR_DOCS, type Relation } from '@/lib/shared';

type Dep = { relation: Relation | '' };

export default function DependentWizard() {
  const [step, setStep] = useState<'form' | 'summary'>('form');
  const [sponsorJO, setSponsorJO] = useState('');
  const [deps, setDeps] = useState<Dep[]>([{ relation: '' }]);
  const [pending, startTransition] = useTransition();

  function setDepCount(n: number) {
    n = Math.max(1, Math.min(6, n));
    const next = [...deps];
    while (next.length < n) next.push({ relation: '' });
    next.length = n;
    setDeps(next);
  }

  const validDeps = deps.filter((d) => d.relation);
  const total = validDeps.length * PRICES.dependent;

  function submit() {
    startTransition(() => {
      createApplication({
        type: 'dependent',
        sponsorJO: sponsorJO || undefined,
        deps: validDeps as { relation: Relation }[],
      });
    });
  }

  return (
    <div className="page-fade pb-28">
      <TopBar title="Dependent Visa" />

      {step === 'form' && (
        <div className="px-5 pt-5">
          <div className="text-[11px] font-bold uppercase tracking-widest text-gold mb-2">Sponsor link</div>
          <h1 className="font-display text-[24px] font-semibold text-navy">Dependent Visa application</h1>
          <p className="mt-2 text-[13.5px] text-muted">
            If the sponsoring investor&apos;s work order already exists, link it below. Otherwise leave blank.
          </p>

          <div className="mt-4">
            <label className="mb-1.5 block text-[12px] font-semibold text-navy">Sponsor work order number (optional)</label>
            <input
              value={sponsorJO}
              onChange={(e) => setSponsorJO(e.target.value)}
              placeholder="e.g. GP-JO-4821"
              className="w-full rounded-[11px] border border-line px-3.5 py-3 text-[14px]"
            />
          </div>
          <div className="mt-3">
            <label className="mb-1.5 block text-[12px] font-semibold text-navy">Number of dependents</label>
            <input
              type="number"
              min={1}
              max={6}
              value={deps.length}
              onChange={(e) => setDepCount(parseInt(e.target.value || '1'))}
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

          <div className="mt-4 rounded-2xl border border-line bg-white p-4">
            <div className="mb-1.5 text-[12.5px] font-bold text-navy">Sponsor documents (collected once)</div>
            {SPONSOR_DOCS.map((d) => (
              <div key={d} className="border-b border-line py-2 text-[13px] text-muted last:border-0">
                {d}
              </div>
            ))}
          </div>

          <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-[480px] bg-gradient-to-t from-sand via-sand px-5 pb-6 pt-5">
            <button
              disabled={validDeps.length === 0}
              onClick={() => setStep('summary')}
              className="w-full rounded-2xl bg-gradient-to-br from-gold-light to-gold py-3.5 font-bold text-navy-deep disabled:opacity-40"
            >
              Continue to Summary
            </button>
          </div>
        </div>
      )}

      {step === 'summary' && (
        <div className="px-5 pt-5">
          <h1 className="font-display text-[20px] font-semibold text-navy">Review your application</h1>
          {sponsorJO && <div className="mt-2 text-[12px] text-muted">Linked sponsor work order: <b>{sponsorJO}</b></div>}
          <div className="mt-4 rounded-2xl border border-line bg-white p-4 text-[13.5px]">
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
