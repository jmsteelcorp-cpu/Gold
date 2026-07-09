import { registerUser } from '@/actions/actions';
import { TopBar } from '@/components/ui';

export default function RegisterPage({ searchParams }: { searchParams: { next?: string; error?: string } }) {
  const next = searchParams.next || '/dashboard';
  return (
    <div className="page-fade pb-10">
      <TopBar title="Create Account" />
      <div className="px-5 pt-6">
        <div className="text-[11px] font-bold uppercase tracking-widest text-gold mb-2">Step 1</div>
        <h1 className="font-display text-[24px] font-semibold text-navy leading-tight">Enter your details</h1>
        <p className="mt-2 text-[13.5px] text-muted leading-relaxed">
          Your email is your username, your contact number acts as your password — this record becomes your account.
        </p>

        {searchParams.error === 'mismatch' && (
          <div className="mt-4 rounded-xl bg-badbg border border-red-200 px-4 py-3 text-[12.5px] text-bad">
            An account already exists for that email, but the contact number doesn&apos;t match.
          </div>
        )}

        <form action={registerUser} className="mt-5 space-y-4">
          <input type="hidden" name="next" value={next} />
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-navy">Email</label>
            <input name="email" type="email" required placeholder="you@example.com" className="w-full rounded-[11px] border border-line px-3.5 py-3 text-[14px]" />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-navy">Contact number</label>
            <input name="contact" type="tel" required placeholder="+971 5X XXX XXXX" className="w-full rounded-[11px] border border-line px-3.5 py-3 text-[14px]" />
          </div>
          <button type="submit" className="w-full rounded-[13px] bg-gradient-to-br from-gold-light to-gold py-3.5 font-bold text-navy-deep">
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
