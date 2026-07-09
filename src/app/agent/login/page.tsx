import { agentLogin } from '@/actions/actions';
import { TopBar } from '@/components/ui';

export default function AgentLoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="page-fade pb-10">
      <TopBar title="Agent Portal" />
      <div className="px-5 pt-8">
        <h1 className="font-display text-[24px] font-semibold text-navy">Agent sign in</h1>
        <p className="mt-2 text-[13.5px] text-muted">Enter the agent number and contact provided when you were onboarded.</p>

        {searchParams.error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-badbg px-4 py-3 text-[12.5px] text-bad">
            Agent number or contact didn&apos;t match our records.
          </div>
        )}

        <form action={agentLogin} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-navy">Agent number</label>
            <input name="agentNo" required placeholder="e.g. AG-1001" className="w-full rounded-[11px] border border-line px-3.5 py-3 text-[14px] uppercase" />
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-navy">Contact</label>
            <input name="contact" required placeholder="Phone or email on file" className="w-full rounded-[11px] border border-line px-3.5 py-3 text-[14px]" />
          </div>
          <button type="submit" className="w-full rounded-[13px] bg-gradient-to-br from-gold-light to-gold py-3.5 font-bold text-navy-deep">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
