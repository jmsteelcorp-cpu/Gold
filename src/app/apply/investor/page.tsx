import { redirect } from 'next/navigation';
import { getSession } from '@/lib/utils';
import InvestorWizard from './Wizard';

export default function InvestorApplyPage() {
  const session = getSession();
  if (!session || session.role !== 'user') redirect('/register?next=/apply/investor');
  return <InvestorWizard />;
}
