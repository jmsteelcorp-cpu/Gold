import { redirect } from 'next/navigation';
import { getSession } from '@/lib/utils';
import ValuationWizard from './Wizard';

export default function ValuationApplyPage() {
  const session = getSession();
  if (!session || session.role !== 'user') redirect('/register?next=/apply/valuation');
  return <ValuationWizard />;
}
