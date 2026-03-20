import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const session = JSON.parse(cookies().get('session')?.value || 'null');
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const { id } = await req.json();
    const { getDbConnection } = await import('@/lib/db');
    const sql = await import('mssql');
    const pool = await getDbConnection();

    // Delete links then menu
    const r1 = pool.request(); r1.input('mid', sql.default.Int, id);
    await r1.query('DELETE FROM MenuPlato WHERE menu_id = @mid');
    const r2 = pool.request(); r2.input('mid', sql.default.Int, id);
    await r2.query('DELETE FROM MenuDiario WHERE id = @mid');

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
