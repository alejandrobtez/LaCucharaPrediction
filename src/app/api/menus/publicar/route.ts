import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const session = JSON.parse(cookies().get('session')?.value || 'null');
    if (!session || session.role !== 'restaurante') return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { precio, fecha, platos, etiquetas } = await req.json();
    const { getDbConnection } = await import('@/lib/db');
    const sql = await import('mssql');
    const pool = await getDbConnection();

    // 1. Insert MenuDiario
    const menuReq = pool.request();
    menuReq.input('rid', sql.default.Int, session.id);
    menuReq.input('fecha', sql.default.Date, new Date(fecha));
    menuReq.input('precio', sql.default.Float, precio);
    menuReq.input('etiquetas', sql.default.NVarChar, etiquetas || '');
    const menuRes = await menuReq.query(
      'INSERT INTO MenuDiario (restaurante_id, fecha, precio, imagen_ocr_url, etiquetas) OUTPUT INSERTED.id VALUES (@rid, @fecha, @precio, \'\', @etiquetas)'
    );
    const menuId = menuRes.recordset[0].id;

    // 2. Insert platos and link
    for (const plato of platos) {
      const platoReq = pool.request();
      platoReq.input('nombre', sql.default.NVarChar, plato.nombre);
      platoReq.input('cat', sql.default.NVarChar, plato.categoria);
      platoReq.input('ing', sql.default.NVarChar, plato.ingredientes_principales || '');
      const platoRes = await platoReq.query(
        'INSERT INTO Plato (nombre, categoria, ingredientes_principales) OUTPUT INSERTED.id VALUES (@nombre, @cat, @ing)'
      );
      const platoId = platoRes.recordset[0].id;

      const linkReq = pool.request();
      linkReq.input('mid', sql.default.Int, menuId);
      linkReq.input('pid', sql.default.Int, platoId);
      await linkReq.query('INSERT INTO MenuPlato (menu_id, plato_id) VALUES (@mid, @pid)');
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
