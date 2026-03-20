import { getSession } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import PrediccionClient from './PrediccionClient';

export default async function PrediccionPage() {
  const session = await getSession();
  if (!session || session.role !== 'restaurante') redirect('/');

  // Obtenemos el aforo máximo del restaurante desde la sesión
  const aforo = session.aforo || 50;

  return <PrediccionClient aforo={aforo} />;
}
