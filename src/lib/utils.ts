import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export * from './shared';

/* ---------------------------------------------------------------
   PRISMA — singleton client (avoids exhausting connections in dev)
--------------------------------------------------------------- */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/* ---------------------------------------------------------------
   IDS
--------------------------------------------------------------- */
export function makeInvoiceNo() {
  return 'INV-' + Math.random().toString(36).slice(2, 7).toUpperCase();
}
export function makeJobOrderNo() {
  return 'GP-JO-' + Math.floor(1000 + Math.random() * 9000);
}
export function makeAgentNo(seq: number) {
  return 'AG-' + (1000 + seq + Math.floor(Math.random() * 9));
}

/* ---------------------------------------------------------------
   PASSWORD-LESS "CONTACT AS PASSWORD" HASHING
   Uses Node's built-in scrypt — no extra dependency required.
--------------------------------------------------------------- */
export function hashContact(contact: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(contact, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
export function verifyContact(contact: string, stored: string) {
  const [salt, hash] = stored.split(':');
  const check = crypto.scryptSync(contact, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(check));
}

/* ---------------------------------------------------------------
   SIGNED SESSION COOKIE (no external auth library required)
   Role is one of: user | admin | agent
--------------------------------------------------------------- */
type Session = { role: 'user' | 'admin' | 'agent'; id: string; label: string };

function secret() {
  return process.env.SESSION_SECRET || 'dev-only-insecure-secret';
}
function sign(payload: string) {
  return crypto.createHmac('sha256', secret()).update(payload).digest('hex');
}
export function setSessionCookie(session: Session) {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  const sig = sign(payload);
  cookies().set('gp_session', `${payload}.${sig}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}
export function clearSessionCookie() {
  cookies().delete('gp_session');
}
export function getSession(): Session | null {
  const raw = cookies().get('gp_session')?.value;
  if (!raw) return null;
  const [payload, sig] = raw.split('.');
  if (!payload || !sig) return null;
  if (sign(payload) !== sig) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------
   HISTORY / TIMELINE HELPERS (stored as JSON string on JobOrder)
--------------------------------------------------------------- */
export function appendHistory(historyJson: string, label: string, note?: string) {
  const list = JSON.parse(historyJson || '[]');
  list.push({ label, note, at: new Date().toISOString() });
  return JSON.stringify(list);
}
