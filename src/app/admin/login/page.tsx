import { adminLogin } from '@/actions/actions';
import { TopBar } from '@/components/ui';

export default function AdminLoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="page-fade pb-10">
      <TopBar title="Admin Sign In" />
      <div className="px-5 pt-8">
        <h1 className="font-display text-[24px] font-semibold text-navy">Staff sign in</h1>
        <p className="mt-2 text-[13.5px] text-muted">Manage invoices, job orders, agents and the ledger.</p>

        {searchParams.error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-badbg px-4 py-3 text-[12.5px] text-bad">Incorrect email or password.</div>
        )}

        <form action={adminLogin} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-navy">Work email</label>
            <input name="email" type="email" required placeholder="admin@goldenpass.ae" className="w-full rounded-[11px] border border-line px-3.5 py-3 text-[14px]" />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-navy">Password</label>
            <input name="password" type="password" required placeholder="••••••••" className="w-full rounded-[11px] border border-line px-3.5 py-3 text-[14px]" />
          </div>
          <button type="submit" className="w-full rounded-[13px] bg-gradient-to-br from-gold-light to-gold py-3.5 font-bold text-navy-deep">
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}
