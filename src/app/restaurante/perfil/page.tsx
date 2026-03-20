import { getSession } from '@/app/actions/auth';
import { queryDb } from '@/lib/db';
import PerfilRestauranteClient from './PerfilRestauranteClient';

export default async function PerfilPage() {
  const session = await getSession();
  const data = await queryDb<any>(
    'SELECT nombre, aforo_maximo, descripcion, telefono, sitio_web, imagen_perfil, imagenes_local, ubicacion FROM Restaurante WHERE id = @id',
    { id: session.id }
  );
  const perfil = data[0] || {};
  return <PerfilRestauranteClient session={session} perfil={perfil} />;
}
