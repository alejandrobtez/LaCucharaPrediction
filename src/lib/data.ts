import { queryDb, getDbConnection } from './db';
import sql from 'mssql';

export async function getActiveMenus() {
  const query = `
    SELECT 
      m.id, m.fecha, m.precio, m.platos, m.etiquetas,
      r.id as rest_id, r.nombre, r.aforo_maximo, r.descripcion, r.imagen_perfil
    FROM MenuDiario m
    JOIN Restaurante r ON m.restaurante_id = r.id
    WHERE CONVERT(date, m.fecha) = CONVERT(date, GETDATE())
  `;
  const result = await queryDb<any>(query);
  return result;
}

export async function getFavoriteRestaurants(userId: number) {
  const query = `SELECT favoritos FROM Usuario WHERE id = @uid`;
  const pool = await getDbConnection();
  const req = pool.request();
  req.input('uid', sql.Int, userId);
  const result = await req.query(query);
  
  if (result.recordset.length === 0) return [];
  const favsStr = result.recordset[0].favoritos || "";
  const favIds = favsStr.split(',').filter((x: string) => x.trim() !== '').map((x: string) => parseInt(x));
  
  if (favIds.length === 0) return [];

  const q2 = `
    SELECT id, nombre, descripcion, imagen_perfil
    FROM Restaurante 
    WHERE id IN (${favIds.join(',')})
  `;
  const rests = await queryDb<any>(q2);
  return rests;
}
