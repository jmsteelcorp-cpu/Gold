/* Pure, dependency-free helpers safe to import from client components. */

export const PRICES = { investor: 13000, dependent: 7000, valuation: 5500 };

export function fmt(n: number) {
  return Math.round(n).toLocaleString('en-US') + ' AED';
}

export const RELATIONS = ['wife', 'husband', 'son', 'daughter', 'parent', 'sister', 'sibling', 'servant'] as const;
export type Relation = (typeof RELATIONS)[number];

export const RELATION_LABEL: Record<Relation, string> = {
  wife: 'Wife',
  husband: 'Husband',
  son: 'Son',
  daughter: 'Daughter',
  parent: 'Parent',
  sister: 'Sister',
  sibling: 'Sibling',
  servant: 'Domestic Staff',
};

export const RELATION_DOC: Record<Relation, string> = {
  wife: 'Marriage Certificate (Attested)',
  husband: 'Marriage Certificate (Attested)',
  son: 'Birth Certificate (Attested)',
  daughter: 'Birth Certificate (Attested)',
  parent: "Investor's Birth Certificate",
  sister: 'Birth Certificate (Attested)',
  sibling: 'Birth Certificate (Attested)',
  servant: 'Offer Letter from Sponsor',
};

export const INVESTOR_BASE_DOCS = ['Passport – Front', 'Passport – Back', 'Passport – Cover Page', 'UAE Visa Page'];
export const SPONSOR_DOCS = [
  'Emirates ID of Sponsor',
  'Visa Copy of Sponsor',
  'Sponsor Passport – Front',
  'Sponsor Passport – Back',
  'Sponsor Passport – Cover Page',
];
export const VALUATION_DOCS = ['Title Deed / Oqood Contract', 'Passport Copy', 'Site Photos (optional)'];

export function investorDocsFor(ownership: string | null | undefined) {
  const docs = [...INVESTOR_BASE_DOCS];
  if (ownership === 'mortgaged') docs.push('NOC from Bank');
  if (ownership === 'offplan') docs.push('Oqood Contract', 'SOA / NOC from Developer');
  return docs;
}
export function dependentDocsFor(relation: Relation) {
  return ['Passport – Front', 'Passport – Back', 'Passport – Cover Page', 'Visa Copy', RELATION_DOC[relation]];
}

export type OcrResult = {
  eligible: boolean;
  ownership: string;
  ownershipLabel: string;
  value: number;
  type: string;
  developer: string;
  project: string;
  purchaseDate: string;
  mortgage: string;
  offplan: string;
  paymentPlan: string;
};

export function runOcrOnDeed(): OcrResult {
  const eligible = Math.random() < 0.75;
  const ownWeights = ['full', 'full', 'mortgaged', 'offplan', 'shared'];
  const ownership = ownWeights[Math.floor(Math.random() * ownWeights.length)];
  const ownershipLabel: Record<string, string> = {
    full: 'Fully Owned',
    mortgaged: 'Mortgaged',
    offplan: 'Off-Plan',
    shared: 'Shared Ownership',
  };
  return {
    eligible,
    ownership,
    ownershipLabel: ownershipLabel[ownership],
    value: eligible ? 2000000 + Math.floor(Math.random() * 1800000) : 1200000 + Math.floor(Math.random() * 700000),
    type: ownership === 'offplan' ? 'Off-Plan Apartment' : 'Ready Apartment',
    developer: 'Emaar Properties',
    project: 'Dubai Creek Residences',
    purchaseDate: '2024-03-11',
    mortgage: ownership === 'mortgaged' ? 'Mortgaged' : 'None',
    offplan: ownership === 'offplan' ? 'Off-Plan' : 'Ready',
    paymentPlan: ownership === 'offplan' ? '60/40 with developer' : 'Fully paid',
  };
}

export function timeAgo(iso: string) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  return Math.floor(hrs / 24) + 'd ago';
}

export type HistoryEntry = { label: string; note?: string; at: string };
export function parseHistory(historyJson: string): HistoryEntry[] {
  try {
    return JSON.parse(historyJson || '[]');
  } catch {
    return [];
  }
}
