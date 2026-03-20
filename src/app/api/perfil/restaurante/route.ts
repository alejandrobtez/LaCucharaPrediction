import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const session = JSON.parse(cookies().get('session')?.value || 'null');
    if (!session || session.role !== 'restaurante') return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const { nombre, aforo, descripcion, telefono, sitio_web, ubicacion } = await req.json();
    const { getDbConnection } = await import('@/lib/db');
    const sql = await import('mssql');
    const pool = await getDbConnection();
    const r = pool.request();
    r.input('nm', sql.default.NVarChar, nombre);
    r.input('af', sql.default.Int, aforo);
    r.input('d', sql.default.NVarChar, descripcion || '');
    r.input('t', sql.default.NVarChar, telefono || '');
    r.input('w', sql.default.NVarChar, sitio_web || '');
    r.input('u', sql.default.NVarChar, ubicacion || '');
    r.input('id', sql.default.Int, session.id);
    await r.query('UPDATE Restaurante SET nombre=@nm, aforo_maximo=@af, descripcion=@d, telefono=@t, sitio_web=@w, ubicacion=@u WHERE id=@id');
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
