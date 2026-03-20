import { getSession } from '@/app/actions/auth';
import { queryDb } from '@/lib/db';
import PerfilClienteClient from './PerfilClienteClient';
import { redirect } from 'next/navigation';

export default async function PerfilPage() {
  const session = await getSession();
  if (!session || session.role !== 'oficinista') redirect('/');

  const data = await queryDb<any>(
    'SELECT nombre, imagen_perfil, sobre_mi, preferencias_dieteticas FROM Usuario WHERE id = @id',
    { id: session.id }
  );
  
  const perfil = data[0] || {};
  
  return <PerfilClienteClient session={session} perfil={perfil} />;
}
