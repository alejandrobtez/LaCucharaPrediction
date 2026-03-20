import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDbConnection } from '@/lib/db';
import sql from 'mssql';

export async function POST(req: NextRequest) {
  try {
    const sessionStr = cookies().get('session')?.value;
    if (!sessionStr) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const session = JSON.parse(sessionStr);

    const { nombre, sobre_mi, preferencias_dieteticas } = await req.json();
    if (!nombre) return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });

    const pool = await getDbConnection();
    await pool.request()
      .input('n', sql.NVarChar, nombre)
      .input('s', sql.NVarChar, sobre_mi || '')
      .input('p', sql.NVarChar, preferencias_dieteticas || '')
      .input('id', sql.Int, session.id)
      .query('UPDATE Usuario SET nombre = @n, sobre_mi = @s, preferencias_dieteticas = @p WHERE id = @id');

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
