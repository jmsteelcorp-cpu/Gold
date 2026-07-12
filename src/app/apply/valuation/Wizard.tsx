'use client';

import { useState, useTransition } from 'react';
import { TopBar } from '@/components/ui';
import { createApplication } from '@/actions/actions';
import { PRICES, fmt, VALUATION_DOCS } from '@/lib/shared';

export default function ValuationWizard() {
  const [step, setStep] = useState<'form' | 'summary'>('form');
  const [property, setProperty] = useState({ type: 'Apartment', location: '', size: '', purpose: 'Ahead of Golden Visa' });
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(() => {
      createApplication({ type: 'valuation', property });
    });
  }

  return (
    <div className="page-fade pb-28">
      <TopBar title="Property Valuation" />

      {step === 'form' && (
        <div className="px-5 pt-5">
          <div className="text-[11px] font-bold uppercase tracking-widest text-gold mb-2">Property details</div>
          <h1 className="font-display text-[24px] font-semibold text-navy">Tell us about the property</h1>

          <div className="mt-4 space-y-3.5">
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-navy">Property type</label>
              <select
                value={property.type}
                onChange={(e) => setProperty({ ...property, type: e.target.value })}
                className="w-full rounded-[11px] border border-line px-3.5 py-3 text-[14px]"
              >
                <option>Apartment</option>
                <option>Villa</option>
                <option>Townhouse</option>
                <option>Commercial</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-navy">Location</label>
              <input
                value={property.location}
                onChange={(e) => setProperty({ ...property, location: e.target.value })}
                placeholder="e.g. Palm Jumeirah"
                className="w-full rounded-[11px] border border-line px-3.5 py-3 text-[14px]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-navy">Size (sqft)</label>
              <input
                type="number"
                value={property.size}
                onChange={(e) => setProperty({ ...property, size: e.target.value })}
                placeholder="1500"
                className="w-full rounded-[11px] border border-line px-3.5 py-3 text-[14px]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-navy">Purpose</label>
              <select
                value={property.purpose}
                onChange={(e) => setProperty({ ...property, purpose: e.target.value })}
                className="w-full rounded-[11px] border border-line px-3.5 py-3 text-[14px]"
              >
                <option>Ahead of Golden Visa</option>
                <option>General</option>
                <option>Sale</option>
                <option>Mortgage</option>
              </select>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-line bg-white p-4">
            <div className="mb-1.5 text-[12.5px] font-bold text-navy">Documents needed</div>
            {VALUATION_DOCS.map((d) => (
              <div key={d} className="border-b border-line py-2 text-[13px] text-muted last:border-0">
                {d}
              </div>
            ))}
          </div>

          <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-[480px] bg-gradient-to-t from-sand via-sand px-5 pb-6 pt-5">
            <button onClick={() => setStep('summary')} className="w-full rounded-2xl bg-gradient-to-br from-gold-light to-gold py-3.5 font-bold text-navy-deep">
              Continue to Summary
            </button>
          </div>
        </div>
      )}

      {step === 'summary' && (
        <div className="px-5 pt-5">
          <h1 className="font-display text-[20px] font-semibold text-navy">Review your request</h1>
          <div className="mt-4 rounded-2xl border border-line bg-white p-4 text-[13.5px]">
            {[
              ['Type', property.type],
              ['Location', property.location || 'Not specified'],
              ['Size', `${property.size || '—'} sqft`],
              ['Purpose', property.purpose],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-line py-2.5">
                <span className="text-muted">{k}</span>
                <span className="font-semibold text-navy">{v}</span>
              </div>
            ))}
            <div className="flex justify-between py-2.5">
              <span className="font-bold text-navy">Total</span>
              <span className="text-[15.5px] font-bold text-navy">{fmt(PRICES.valuation)}</span>
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
