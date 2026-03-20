import { getSession } from '@/app/actions/auth';
import { queryDb } from '@/lib/db';
import MenusPublicadosClient from './MenusPublicadosClient';

export default async function MenusPublicadosPage() {
  const session = await getSession();
  const menus = await queryDb<any>(
    'SELECT id, precio, fecha, imagen_ocr_url FROM MenuDiario WHERE restaurante_id = @rid ORDER BY fecha DESC',
    { rid: session.id }
  );

  const menusConPlatos = await Promise.all(menus.map(async (m: any) => {
    const platos = await queryDb<any>(
      'SELECT p.nombre, p.categoria, p.ingredientes_principales FROM Plato p JOIN MenuPlato mp ON p.id = mp.plato_id WHERE mp.menu_id = @mid',
      { mid: m.id }
    );
    return { ...m, platos };
  }));

  return <MenusPublicadosClient menus={menusConPlatos} />;
}
