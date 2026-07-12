'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { TopBar } from '@/components/ui';
import { submitInvoice } from '@/actions/actions';
import { fmt } from '@/lib/shared';

export default function PaymentForm({
  applicationId,
  invoiceNo,
  amount,
  status,
  paymentLink,
  commission,
  agentCode,
}: {
  applicationId: string;
  invoiceNo: string;
  amount: number;
  status: string;
  paymentLink: string | null;
  commission: number;
  agentCode: string | null;
}) {
  const [billingName, setBillingName] = useState('');
  const [code, setCode] = useState('');
  const [method, setMethod] = useState('Card');
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(status !== 'invoice_created');

  function submit() {
    startTransition(async () => {
      await submitInvoice(applicationId, { billingName, agentCode: code, paymentMethod: method });
      setSubmitted(true);
    });
  }

  if (submitted) {
    return (
      <div className="page-fade pb-10">
        <TopBar title="Golden Pass" />
        <div className="px-5 pt-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-okgreenbg text-4xl">🧾</div>
          <h1 className="font-display text-[20px] font-semibold text-navy">Invoice {invoiceNo} submitted</h1>
          <p className="mx-auto mt-2 max-w-[280px] text-[13.5px] text-muted">
            Our team is preparing a secure payment link for {fmt(amount)}. You&apos;ll see a &quot;Pay Now&quot; button on your dashboard once it&apos;s ready.
          </p>
          {commission > 0 && agentCode && <div className="mt-2.5 text-[12px] text-muted">Agent code {agentCode} applied</div>}
        </div>
        <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-[480px] bg-gradient-to-t from-sand via-sand px-5 pb-6 pt-5">
          <Link href="/dashboard" className="block w-full rounded-2xl bg-gradient-to-br from-gold-light to-gold py-3.5 text-center font-bold text-navy-deep">
            Go to My Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-fade pb-28">
      <TopBar title="Invoice" />
      <div className="px-5 pt-4">
        <div className="text-[11px] font-bold uppercase tracking-widest text-gold mb-2">{invoiceNo}</div>
        <h1 className="font-display text-[20px] font-semibold text-navy">Confirm &amp; submit invoice</h1>

        <div className="mt-3.5 rounded-2xl border border-line bg-white p-4">
          <div className="flex justify-between py-1">
            <span className="text-[13.5px] text-muted">Amount due</span>
            <span className="text-[15.5px] font-bold text-navy">{fmt(amount)}</span>
          </div>
        </div>

        <div className="mt-4 space-y-3.5">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-navy">Billing name</label>
            <input value={billingName} onChange={(e) => setBillingName(e.target.value)} placeholder="Full name for invoice" className="w-full rounded-[11px] border border-line px-3.5 py-3 text-[14px]" />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-navy">Agent code (optional)</label>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. AG-1001" className="w-full rounded-[11px] border border-line px-3.5 py-3 text-[14px] uppercase" />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-navy">Preferred payment method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full rounded-[11px] border border-line px-3.5 py-3 text-[14px]">
              <option>Card</option>
              <option>Bank Transfer</option>
              <option>Telr Payment Link</option>
            </select>
          </div>
          <p className="text-[11px] text-muted">
            Agent codes are issued when an agent is onboarded by admin — ask your agent for theirs. After you submit, our team will
            issue a secure payment link to your dashboard.
          </p>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-[480px] bg-gradient-to-t from-sand via-sand px-5 pb-6 pt-5">
        <button disabled={pending} onClick={submit} className="w-full rounded-2xl bg-gradient-to-br from-gold-light to-gold py-3.5 font-bold text-navy-deep disabled:opacity-60">
          {pending ? 'Submitting…' : 'Submit Invoice'}
        </button>
      </div>
    </div>
  );
}
