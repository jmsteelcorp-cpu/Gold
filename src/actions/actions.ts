'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  prisma,
  PRICES,
  hashContact,
  verifyContact,
  setSessionCookie,
  clearSessionCookie,
  getSession,
  makeInvoiceNo,
  makeJobOrderNo,
  makeAgentNo,
  appendHistory,
  investorDocsFor,
  dependentDocsFor,
  runOcrOnDeed,
  SPONSOR_DOCS,
  VALUATION_DOCS,
  Relation,
} from '@/lib/utils';
import { sendEmail } from '@/lib/email';

export async function ocrCheck() {
  // Simulated network delay so the loading state feels real.
  await new Promise((r) => setTimeout(r, 1200));
  return runOcrOnDeed();
}

/* =====================================================================
   AUTH
===================================================================== */
export async function registerUser(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const contact = String(formData.get('contact') || '').trim();
  const next = String(formData.get('next') || '/dashboard');
  if (!email || !contact) redirect(`/register?next=${encodeURIComponent(next)}&error=missing`);

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({ data: { email, contactHash: hashContact(contact) } });
    await sendEmail(email, 'Welcome to Golden Pass', 'Your account is set up. You can track every application from your dashboard, any time.');
  } else if (!verifyContact(contact, user.contactHash)) {
    redirect(`/register?next=${encodeURIComponent(next)}&error=mismatch`);
  }
  setSessionCookie({ role: 'user', id: user.id, label: email });
  redirect(next);
}

export async function loginUser(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const contact = String(formData.get('contact') || '').trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyContact(contact, user.contactHash)) redirect('/login?error=1');
  setSessionCookie({ role: 'user', id: user.id, label: email });
  redirect('/dashboard');
}

export async function adminLogin(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
    redirect('/admin/login?error=1');
  }
  setSessionCookie({ role: 'admin', id: 'admin', label: 'Admin' });
  redirect('/admin/dashboard');
}

export async function agentLogin(formData: FormData) {
  const agentNo = String(formData.get('agentNo') || '').trim().toUpperCase();
  const contact = String(formData.get('contact') || '').trim();
  const agent = await prisma.agent.findUnique({ where: { agentNo } });
  if (!agent || (agent.contact && agent.contact.replace(/\s/g, '') !== contact.replace(/\s/g, ''))) {
    redirect('/agent/login?error=1');
  }
  setSessionCookie({ role: 'agent', id: agent!.agentNo, label: agent!.agentName });
  redirect('/agent/dashboard');
}

export async function logoutUser() {
  clearSessionCookie();
  redirect('/');
}

/* =====================================================================
   APPLICATIONS (invoice-level records)
===================================================================== */
type CreateApplicationInput = {
  type: 'investor' | 'dependent' | 'valuation';
  ownership?: string;
  ocr?: Record<string, unknown>;
  deps?: { relation: Relation }[];
  sponsorJO?: string;
  property?: Record<string, unknown>;
};

export async function createApplication(input: CreateApplicationInput) {
  const session = getSession();
  if (!session || session.role !== 'user') redirect('/register');

  const deps = (input.deps || []).filter((d) => d.relation);
  let amount = 0;
  if (input.type === 'investor') amount = PRICES.investor + deps.length * PRICES.dependent;
  if (input.type === 'dependent') amount = deps.length * PRICES.dependent;
  if (input.type === 'valuation') amount = PRICES.valuation;

  const app = await prisma.application.create({
    data: {
      invoiceNo: makeInvoiceNo(),
      userId: session.id,
      type: input.type,
      ownership: input.ownership || null,
      ocrJson: input.ocr ? JSON.stringify(input.ocr) : null,
      depsJson: JSON.stringify(deps),
      sponsorJO: input.sponsorJO || null,
      propertyJson: input.property ? JSON.stringify(input.property) : null,
      amount,
    },
  });
  redirect(`/payment/${app.id}`);
}

export async function submitInvoice(
  applicationId: string,
  input: { billingName: string; agentCode?: string; paymentMethod: string }
) {
  const session = getSession();
  if (!session || session.role !== 'user') redirect('/login');
  const app = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!app || app.userId !== session.id) redirect('/dashboard');

  let commission = 0;
  let agentCode: string | null = null;
  const code = (input.agentCode || '').trim().toUpperCase();
  if (code) {
    const agent = await prisma.agent.findUnique({ where: { agentNo: code } });
    if (agent && agent.active) {
      commission = agent.commissionType === 'percentage' ? Math.round((app.amount * agent.commissionValue) / 100) : agent.commissionValue;
      agentCode = code;
      await prisma.agent.update({
        where: { agentNo: code },
        data: { uses: { increment: 1 }, earnings: { increment: commission } },
      });
    }
  }

  await prisma.application.update({
    where: { id: applicationId },
    data: {
      billingName: input.billingName || session.label,
      paymentMethod: input.paymentMethod,
      agentCode,
      commission,
      status: 'link_sent',
    },
  });
  revalidatePath(`/payment/${applicationId}`);
  revalidatePath('/dashboard');
}

/* =====================================================================
   JOB ORDER CREATION (fires once admin confirms payment)
===================================================================== */
async function createJobOrdersForApplication(app: {
  id: string;
  type: string;
  ownership: string | null;
  depsJson: string;
  sponsorJO: string | null;
  billingName: string | null;
}) {
  const deps: { relation: Relation }[] = JSON.parse(app.depsJson || '[]');
  let count = 0;

  async function makeOne(opts: {
    relationship: string | null;
    holderName: string;
    amount: number;
    docs: string[];
    kind: 'visa' | 'valuation';
    sponsorJO?: string | null;
  }) {
    await prisma.jobOrder.create({
      data: {
        jobOrderNumber: makeJobOrderNo(),
        applicationId: app.id,
        kind: opts.kind,
        relationship: opts.relationship,
        holderName: opts.holderName,
        amount: opts.amount,
        slaDays: opts.kind === 'valuation' ? 7 : 15,
        historyJson: JSON.stringify([{ label: 'Work order created', at: new Date().toISOString() }]),
        documents: { create: opts.docs.map((type) => ({ type })) },
      },
    });
    count++;
  }

  if (app.type === 'investor') {
    await makeOne({
      relationship: 'investor',
      holderName: app.billingName || 'Investor',
      amount: PRICES.investor,
      docs: investorDocsFor(app.ownership),
      kind: 'visa',
    });
    for (const d of deps) {
      await makeOne({
        relationship: d.relation,
        holderName: `${d.relation} of ${app.billingName || 'Investor'}`,
        amount: PRICES.dependent,
        docs: dependentDocsFor(d.relation),
        kind: 'visa',
      });
    }
  } else if (app.type === 'dependent') {
    for (const d of deps) {
      await makeOne({
        relationship: d.relation,
        holderName: `${d.relation} of ${app.billingName || 'Sponsor'}`,
        amount: PRICES.dependent,
        docs: [...dependentDocsFor(d.relation), ...SPONSOR_DOCS],
        kind: 'visa',
        sponsorJO: app.sponsorJO,
      });
    }
  } else if (app.type === 'valuation') {
    await prisma.jobOrder.create({
      data: {
        jobOrderNumber: makeJobOrderNo(),
        applicationId: app.id,
        kind: 'valuation',
        holderName: app.billingName || 'Applicant',
        amount: PRICES.valuation,
        slaDays: 7,
        valuationStage: 'received',
        historyJson: JSON.stringify([{ label: 'Work order created', at: new Date().toISOString() }]),
        documents: { create: VALUATION_DOCS.map((type) => ({ type })) },
      },
    });
    count++;
  }
  return count;
}

async function notify(userId: string, message: string) {
  await prisma.notification.create({ data: { userId, message } });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user) await sendEmail(user.email, 'Update on your Golden Pass application', message);
}

/* =====================================================================
   ADMIN — PAYMENTS
===================================================================== */
function assertAdmin() {
  const session = getSession();
  if (!session || session.role !== 'admin') redirect('/admin/login');
  return session;
}

export async function sendPaymentLink(applicationId: string, link: string) {
  assertAdmin();
  const app = await prisma.application.update({
    where: { id: applicationId },
    data: { paymentLink: link || `https://pay.telr.com/${applicationId}` },
  });
  await notify(app.userId, `Payment link ready for invoice ${app.invoiceNo} (${app.amount.toLocaleString()} AED)`);
  revalidatePath('/admin/dashboard');
}

export async function confirmPayment(applicationId: string) {
  assertAdmin();
  const app = await prisma.application.update({ where: { id: applicationId }, data: { status: 'paid' } });
  await prisma.ledgerEntry.create({
    data: {
      type: 'payment',
      label: `${app.type[0].toUpperCase()}${app.type.slice(1)} payment`,
      ref: app.invoiceNo,
      amount: app.amount,
    },
  });
  const count = await createJobOrdersForApplication(app);
  await notify(app.userId, `Payment confirmed for ${app.invoiceNo} — ${count} work order${count > 1 ? 's' : ''} created`);
  revalidatePath('/admin/dashboard');
  revalidatePath('/dashboard');
}

/* =====================================================================
   ADMIN — DOCUMENT REVIEW
===================================================================== */
export async function reviewDocument(jobOrderId: string, docId: string, action: 'verify' | 'reject', comment?: string) {
  assertAdmin();
  const jo = await prisma.jobOrder.findUnique({ where: { id: jobOrderId }, include: { documents: true, application: true } });
  if (!jo) return;

  if (action === 'verify') {
    await prisma.document.update({ where: { id: docId }, data: { status: 'verified', comment: null } });
  } else {
    const doc = jo.documents.find((d) => d.id === docId);
    const reason = comment || 'Please re-upload a clearer copy';
    await prisma.document.update({ where: { id: docId }, data: { status: 'rejected', comment: reason } });
    const history = appendHistory(jo.historyJson, `Document rejected: ${doc?.type}`, reason);
    await prisma.jobOrder.update({ where: { id: jobOrderId }, data: { docPhase: 'needs_reupload', historyJson: history } });
    await notify(jo.application.userId, `${jo.jobOrderNumber}: "${doc?.type}" was rejected — ${reason}`);
    revalidatePath(`/admin/job-orders/${jobOrderId}`);
    return;
  }

  const fresh = await prisma.jobOrder.findUnique({ where: { id: jobOrderId }, include: { documents: true, application: true } });
  if (fresh && fresh.documents.every((d) => d.status === 'verified')) {
    const history = appendHistory(fresh.historyJson, 'All documents verified');
    await prisma.jobOrder.update({
      where: { id: jobOrderId },
      data: { docPhase: 'verified', historyJson: history, valuationStage: fresh.kind === 'valuation' ? 'received' : fresh.valuationStage },
    });
    await notify(fresh.application.userId, `${fresh.jobOrderNumber}: all documents verified — processing has started`);
  }
  revalidatePath(`/admin/job-orders/${jobOrderId}`);
}

/* =====================================================================
   ADMIN — GOVERNMENT STAGE CONTROLS
===================================================================== */
const STAGE_OPTIONS: Record<string, string[]> = {
  dld: ['pending', 'applied', 'approved'],
  gdrfa: ['pending', 'applied', 'approved'],
  emiratesId: ['not_started', 'printing', 'courier'],
};

export async function advanceStage(jobOrderId: string, field: 'dld' | 'gdrfa' | 'emiratesId', label: string) {
  assertAdmin();
  const jo = await prisma.jobOrder.findUnique({ where: { id: jobOrderId }, include: { application: true } });
  if (!jo) return;
  const options = STAGE_OPTIONS[field];
  const cur = (jo as any)[field] as string;
  const next = options[Math.min(options.indexOf(cur) + 1, options.length - 1)];
  const history = appendHistory(jo.historyJson, `${label} → ${next.replace('_', ' ')}`);
  await prisma.jobOrder.update({ where: { id: jobOrderId }, data: { [field]: next, historyJson: history } as any });
  await notify(jo.application.userId, `${jo.jobOrderNumber}: ${label} is now ${next.replace('_', ' ')}`);
  revalidatePath(`/admin/job-orders/${jobOrderId}`);
}

export async function scheduleAppointment(jobOrderId: string, field: 'medical' | 'biometric', date: string, label: string) {
  assertAdmin();
  if (!date) return;
  const dateField = field === 'medical' ? 'medicalDate' : 'biometricDate';
  const jo = await prisma.jobOrder.findUnique({ where: { id: jobOrderId }, include: { application: true } });
  if (!jo) return;
  const history = appendHistory(jo.historyJson, `${label} appointment scheduled`, `Date: ${date}`);
  await prisma.jobOrder.update({ where: { id: jobOrderId }, data: { [field]: 'scheduled', [dateField]: date, historyJson: history } as any });
  await notify(jo.application.userId, `${jo.jobOrderNumber}: ${label} appointment set for ${date}`);
  revalidatePath(`/admin/job-orders/${jobOrderId}`);
}

export async function completeAppointment(jobOrderId: string, field: 'medical' | 'biometric', label: string) {
  assertAdmin();
  const jo = await prisma.jobOrder.findUnique({ where: { id: jobOrderId }, include: { application: true } });
  if (!jo) return;
  const history = appendHistory(jo.historyJson, `${label} completed`);
  await prisma.jobOrder.update({ where: { id: jobOrderId }, data: { [field]: 'completed', historyJson: history } as any });
  await notify(jo.application.userId, `${jo.jobOrderNumber}: ${label} marked completed`);
  revalidatePath(`/admin/job-orders/${jobOrderId}`);
}

export async function completeTask(jobOrderId: string) {
  assertAdmin();
  const jo = await prisma.jobOrder.findUnique({ where: { id: jobOrderId }, include: { application: true } });
  if (!jo) return;
  const history = appendHistory(jo.historyJson, 'Task marked complete — Emirates ID dispatched');
  await prisma.jobOrder.update({ where: { id: jobOrderId }, data: { taskStatus: 'completed', historyJson: history } });
  await notify(jo.application.userId, `${jo.jobOrderNumber} is complete! Emirates ID has been dispatched.`);
  revalidatePath(`/admin/job-orders/${jobOrderId}`);
}

export async function setValuationStage(jobOrderId: string, stage: string) {
  assertAdmin();
  const jo = await prisma.jobOrder.findUnique({ where: { id: jobOrderId }, include: { application: true } });
  if (!jo) return;
  const history = appendHistory(jo.historyJson, `Valuation stage → ${stage.replace('_', ' ')}`);
  await prisma.jobOrder.update({ where: { id: jobOrderId }, data: { valuationStage: stage, historyJson: history } });
  await notify(jo.application.userId, `${jo.jobOrderNumber}: valuation stage updated to ${stage.replace('_', ' ')}`);
  revalidatePath(`/admin/job-orders/${jobOrderId}`);
}

export async function saveValuationReport(jobOrderId: string, reportValue: number, reportNotes: string) {
  assertAdmin();
  await prisma.jobOrder.update({ where: { id: jobOrderId }, data: { reportValue, reportNotes } });
  revalidatePath(`/admin/job-orders/${jobOrderId}`);
}

/* =====================================================================
   ADMIN — AGENTS
===================================================================== */
export async function onboardAgent(input: { name: string; contact: string; commissionType: string; commissionValue: number }) {
  assertAdmin();
  const count = await prisma.agent.count();
  const agentNo = makeAgentNo(count + 1);
  await prisma.agent.create({
    data: {
      agentNo,
      agentName: input.name,
      contact: input.contact,
      commissionType: input.commissionType,
      commissionValue: input.commissionValue,
    },
  });
  revalidatePath('/admin/dashboard');
  return agentNo;
}

export async function markCommissionPaid(agentNo: string) {
  assertAdmin();
  const agent = await prisma.agent.findUnique({ where: { agentNo } });
  if (!agent) return;
  await prisma.ledgerEntry.create({
    data: { type: 'commission', label: `Commission payout — ${agentNo}`, ref: agentNo, amount: -agent.earnings },
  });
  await prisma.agent.update({
    where: { agentNo },
    data: { totalPaid: { increment: agent.earnings }, earnings: 0, payoutStatus: 'paid' },
  });
  revalidatePath('/admin/dashboard');
}

/* =====================================================================
   APPLICANT — DOCUMENT UPLOAD (with OCR confirmation) & SUBMISSION
===================================================================== */
export async function uploadDocument(jobOrderId: string, docId: string, fileData: string, fileName: string) {
  const session = getSession();
  if (!session || session.role !== 'user') redirect('/login');
  // Simulated OCR confirmation — swap for a real Textract call keyed on doc.type and fileData.
  await prisma.document.update({
    where: { id: docId },
    data: { status: 'uploaded', ocrConfirmed: true, comment: null, fileData, fileName },
  });
  const jo = await prisma.jobOrder.findUnique({ where: { id: jobOrderId }, include: { documents: true } });
  if (jo && jo.docPhase === 'needs_reupload' && jo.documents.every((d) => d.status === 'uploaded' || d.status === 'verified')) {
    await prisma.jobOrder.update({ where: { id: jobOrderId }, data: { docPhase: 'awaiting_upload' } });
  }
  revalidatePath(`/dashboard/${jobOrderId}`);
}

export async function submitDocuments(jobOrderId: string) {
  const session = getSession();
  if (!session || session.role !== 'user') redirect('/login');
  const jo = await prisma.jobOrder.findUnique({ where: { id: jobOrderId } });
  if (!jo) return;
  const history = appendHistory(jo.historyJson, 'Documents submitted to admin');
  await prisma.jobOrder.update({ where: { id: jobOrderId }, data: { docPhase: 'submitted', historyJson: history } });
  revalidatePath(`/dashboard/${jobOrderId}`);
}

/* =====================================================================
   PAYMENT PAGE — "pay now" click (manual-link flow; Stripe hook below)
===================================================================== */
export async function markLinkClicked(applicationId: string) {
  // Placeholder for the moment a user actually completes payment on the
  // provider's hosted page. In the manual-link model, admin confirms
  // receipt instead (see confirmPayment). If STRIPE_SECRET_KEY is set,
  // wire a real Checkout Session here and let the Stripe webhook
  // (src/app/api/webhooks/stripe/route.ts) call confirmPayment instead.
  revalidatePath(`/payment/${applicationId}`);
}

export async function markNotificationsRead() {
  const session = getSession();
  if (!session || session.role !== 'user') return;
  await prisma.notification.updateMany({ where: { userId: session.id, read: false }, data: { read: true } });
  revalidatePath('/notifications');
}
