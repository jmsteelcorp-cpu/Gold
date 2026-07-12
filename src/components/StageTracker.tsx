'use client';

export type DocRow = { id: string; type: string; status: string; comment: string | null; ocrConfirmed: boolean; fileName?: string | null; fileData?: string | null };
export type HistoryEntry = { label: string; note?: string; at: string };

function timeAgoClient(iso: string) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  return Math.floor(hrs / 24) + 'd ago';
}

export function Badge({ tone, children }: { tone: 'green' | 'gold' | 'red' | 'navy'; children: React.ReactNode }) {
  const map = {
    green: 'bg-okgreenbg text-okgreen',
    gold: 'bg-warnbg text-warn',
    red: 'bg-badbg text-bad',
    navy: 'bg-[#E9EEF4] text-navy',
  } as const;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap ${map[tone]}`}>{children}</span>;
}

export function StageRow({ name, value, done, note }: { name: string; value: string; done: boolean; note?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-3 last:border-0">
      <div>
        <div className="text-[13px] font-semibold text-navy">{name}</div>
        {note && <div className="text-[11px] text-muted mt-0.5 max-w-[210px]">{note}</div>}
      </div>
      <Badge tone={done ? 'green' : 'gold'}>{value}</Badge>
    </div>
  );
}

export function GovStageTracker({
  dld,
  gdrfa,
  medical,
  medicalDate,
  biometric,
  biometricDate,
  emiratesId,
}: {
  dld: string;
  gdrfa: string;
  medical: string;
  medicalDate: string | null;
  biometric: string;
  biometricDate: string | null;
  emiratesId: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <StageRow name="DLD Approval" value={dld === 'approved' ? 'Approved' : dld === 'applied' ? 'Applied' : 'Pending'} done={dld === 'approved'} />
      <StageRow name="GDRFA" value={gdrfa === 'approved' ? 'Approved' : gdrfa === 'applied' ? 'Applied' : 'Pending'} done={gdrfa === 'approved'} />
      <StageRow
        name="Medical Test"
        value={medical === 'completed' ? 'Completed' : medical === 'scheduled' ? 'Scheduled' : 'Pending'}
        done={medical === 'completed'}
        note={medicalDate ? `Appointment: ${medicalDate} — visit the medical center in person.` : medical === 'pending' ? 'Awaiting appointment from admin.' : undefined}
      />
      <StageRow
        name="Biometrics"
        value={biometric === 'completed' ? 'Completed' : biometric === 'scheduled' ? 'Scheduled' : 'Pending'}
        done={biometric === 'completed'}
        note={biometricDate ? `Appointment: ${biometricDate} — visit an ICP typing center in person.` : biometric === 'pending' ? 'Awaiting appointment from admin.' : undefined}
      />
      <StageRow name="Emirates ID" value={emiratesId === 'courier' ? 'Courier' : emiratesId === 'printing' ? 'Printing' : 'Not Started'} done={emiratesId === 'courier'} />
    </div>
  );
}

export function UpdateHistory({ history }: { history: HistoryEntry[] }) {
  if (!history.length) return null;
  const items = [...history].reverse();
  return (
    <div>
      <h3 className="text-[13.5px] font-semibold text-navy my-3">Updates, time to time</h3>
      <div className="rounded-2xl border border-line bg-white p-4">
        {items.map((h, i) => (
          <div key={i} className="flex gap-3 pb-4 last:pb-0">
            <div className="flex flex-col items-center">
              <div className={`h-3 w-3 rounded-full ${i === 0 ? 'bg-gold ring-4 ring-gold/20' : 'bg-okgreen'}`} />
              {i < items.length - 1 && <div className="w-0.5 flex-1 bg-line mt-1" />}
            </div>
            <div>
              <div className="text-[13px] font-bold text-navy">{h.label}</div>
              {h.note && <div className="text-[11.5px] text-muted mt-0.5">{h.note}</div>}
              <div className="text-[11.5px] text-muted mt-0.5">{timeAgoClient(h.at)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ValuationProgress({ stage }: { stage: string | null }) {
  const steps = ['received', 'assessment', 'report_prep', 'ready'];
  const labels = ['Received', 'Assessment', 'Report Prep', 'Ready'];
  const idx = steps.indexOf(stage || 'received');
  return (
    <div className="relative flex justify-between my-5">
      <div className="absolute top-[9px] left-3.5 right-3.5 h-0.5 bg-line" />
      {labels.map((l, i) => (
        <div key={l} className="relative z-10 flex flex-1 flex-col items-center gap-1.5">
          <div className={`h-4.5 w-4.5 h-[18px] w-[18px] rounded-full border-4 border-sand ${i < idx ? 'bg-okgreen' : i === idx ? 'bg-gold' : 'bg-line'}`} />
          <div className={`text-[9.5px] font-semibold text-center max-w-[60px] ${i <= idx ? 'text-navy' : 'text-muted'}`}>{l}</div>
        </div>
      ))}
    </div>
  );
}
