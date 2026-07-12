import { loginUser } from '@/actions/actions';
import { TopBar } from '@/components/ui';

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="page-fade pb-10">
      <TopBar title="Track My Application" />
      <div className="px-5 pt-8">
        <h1 className="font-display text-[24px] font-semibold text-navy">Sign in</h1>
        <p className="mt-2 text-[13.5px] text-muted">Enter the email and contact number used when you applied.</p>

        {searchParams.error && (
          <div className="mt-4 rounded-xl bg-badbg border border-red-200 px-4 py-3 text-[12.5px] text-bad">
            We couldn&apos;t match that email and contact number.
          </div>
        )}

        <form action={loginUser} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-navy">Email</label>
            <input name="email" type="email" required placeholder="you@example.com" className="w-full rounded-[11px] border border-line px-3.5 py-3 text-[14px]" />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-navy">Contact number</label>
            <input name="contact" type="tel" required placeholder="+971 5X XXX XXXX" className="w-full rounded-[11px] border border-line px-3.5 py-3 text-[14px]" />
          </div>
          <button type="submit" className="w-full rounded-[13px] bg-gradient-to-br from-gold-light to-gold py-3.5 font-bold text-navy-deep">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
