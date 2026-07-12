import { redirect } from 'next/navigation';
import { getSession } from '@/lib/utils';
import DependentWizard from './Wizard';

export default function DependentApplyPage() {
  const session = getSession();
  if (!session || session.role !== 'user') redirect('/register?next=/apply/dependent');
  return <DependentWizard />;
}
