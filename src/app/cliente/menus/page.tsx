import { getSession } from '@/app/actions/auth';
import { queryDb } from '@/lib/db';
import MenusDisponiblesClient from './MenusDisponiblesClient';

export default async function MenusPage() {
  const session = await getSession();
  const menus = await queryDb<any>(`
    SELECT DISTINCT m.id as menu_id, r.id as restaurante_id, r.nombre as restaurante_nombre,
           m.precio, m.etiquetas
    FROM MenuDiario m
    JOIN Restaurante r ON m.restaurante_id = r.id
    WHERE CONVERT(date, m.fecha) = CONVERT(date, GETDATE())
  `);

  const favData = await queryDb<any>('SELECT favoritos FROM Usuario WHERE id = @id', { id: session.id });
  const favsRaw = favData[0]?.favoritos || '';
  const favIds: number[] = favsRaw ? favsRaw.split(',').map((x: string) => parseInt(x)).filter((n: number) => !isNaN(n)) : [];

  return <MenusDisponiblesClient menus={menus} initialFavIds={favIds} userId={session.id} />;
}
