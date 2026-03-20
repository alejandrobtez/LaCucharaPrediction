import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const session = JSON.parse(cookies().get('session')?.value || 'null');
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { id, precio, platos } = await req.json();
    const { getDbConnection } = await import('@/lib/db');
    const sql = await import('mssql');
    const pool = await getDbConnection();

    // Delete existing platos
    const r1 = pool.request(); r1.input('mid', sql.default.Int, id);
    await r1.query('DELETE FROM MenuPlato WHERE menu_id = @mid');

    // Update precio
    const r2 = pool.request();
    r2.input('p', sql.default.Float, precio);
    r2.input('mid', sql.default.Int, id);
    await r2.query('UPDATE MenuDiario SET precio = @p WHERE id = @mid');

    // Re-insert platos
    for (const plato of platos) {
      const rp = pool.request();
      rp.input('nombre', sql.default.NVarChar, plato.nombre);
      rp.input('cat', sql.default.NVarChar, plato.categoria);
      rp.input('ing', sql.default.NVarChar, plato.ingredientes_principales || '');
      const pr = await rp.query('INSERT INTO Plato (nombre, categoria, ingredientes_principales) OUTPUT INSERTED.id VALUES (@nombre, @cat, @ing)');
      const pid = pr.recordset[0].id;

      const rl = pool.request();
      rl.input('mid', sql.default.Int, id);
      rl.input('pid', sql.default.Int, pid);
      await rl.query('INSERT INTO MenuPlato (menu_id, plato_id) VALUES (@mid, @pid)');
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
