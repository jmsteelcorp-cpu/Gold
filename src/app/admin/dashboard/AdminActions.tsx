'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { sendPaymentLink, confirmPayment, onboardAgent, markCommissionPaid } from '@/actions/actions';

export function PaymentLinkForm({ applicationId }: { applicationId: string }) {
  const [link, setLink] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <div className="mt-2.5">
      <label className="mb-1.5 block text-[12px] font-semibold text-navy">Payment link</label>
      <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://pay.telr.com/..." className="w-full rounded-[10px] border border-line px-3 py-2.5 text-[13px]" />
      <button
        disabled={pending}
        onClick={() => startTransition(async () => { await sendPaymentLink(applicationId, link); router.refresh(); })}
        className="mt-2 w-full rounded-xl bg-navy py-2.5 text-[13px] font-bold text-white disabled:opacity-60"
      >
        {pending ? 'Sending…' : 'Send Link to Applicant'}
      </button>
    </div>
  );
}

export function ConfirmPaymentButton({ applicationId }: { applicationId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => { await confirmPayment(applicationId); router.refresh(); })}
      className="mt-2.5 w-full rounded-xl bg-okgreenbg py-2.5 text-[13px] font-bold text-okgreen disabled:opacity-60"
    >
      {pending ? 'Confirming…' : 'Confirm Payment Received'}
    </button>
  );
}

export function OnboardAgentForm() {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [type, setType] = useState('percentage');
  const [value, setValue] = useState('');
  const [pending, startTransition] = useTransition();
  const [lastCode, setLastCode] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="mb-1 text-[13px] font-bold text-navy">Onboard a new agent</div>
      <div className="mb-3 text-[11px] text-muted">The agent number is generated automatically once onboarded — agents don&apos;t choose their own code.</div>
      <div className="space-y-2.5">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Agent / agency name" className="w-full rounded-[10px] border border-line px-3 py-2.5 text-[13px]" />
        <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Phone or email" className="w-full rounded-[10px] border border-line px-3 py-2.5 text-[13px]" />
        <div className="flex gap-2.5">
          <select value={type} onChange={(e) => setType(e.target.value)} className="flex-1 rounded-[10px] border border-line px-3 py-2.5 text-[13px]">
            <option value="percentage">Percentage</option>
            <option value="flat">Flat AED</option>
          </select>
          <input value={value} onChange={(e) => setValue(e.target.value)} type="number" placeholder="10" className="flex-1 rounded-[10px] border border-line px-3 py-2.5 text-[13px]" />
        </div>
        <button
          disabled={pending || !name}
          onClick={() =>
            startTransition(async () => {
              const code = await onboardAgent({ name, contact, commissionType: type, commissionValue: Number(value || 0) });
              setLastCode(code);
              setName(''); setContact(''); setValue('');
              router.refresh();
            })
          }
          className="w-full rounded-xl bg-navy py-2.5 text-[13px] font-bold text-white disabled:opacity-60"
        >
          {pending ? 'Onboarding…' : 'Onboard Agent'}
        </button>
        {lastCode && <div className="text-center text-[12px] font-semibold text-okgreen">Agent onboarded — code {lastCode} generated</div>}
      </div>
    </div>
  );
}

export function MarkPaidButton({ agentNo }: { agentNo: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => { await markCommissionPaid(agentNo); router.refresh(); })}
      className="mt-2 w-full rounded-xl bg-okgreenbg py-2.5 text-[13px] font-bold text-okgreen disabled:opacity-60"
    >
      {pending ? 'Marking…' : 'Mark Commission Paid'}
    </button>
  );
}
