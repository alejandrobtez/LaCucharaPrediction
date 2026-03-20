import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { queryDb, getDbConnection } from '@/lib/db';
import sql from 'mssql';

export async function POST(req: NextRequest) {
  try {
    const sessionStr = cookies().get('session')?.value;
    if (!sessionStr) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const session = JSON.parse(sessionStr);

    const { rid, isFav } = await req.json();

    // 1. Get current favorites
    const data = await queryDb<{ favoritos: string }>('SELECT favoritos FROM Usuario WHERE id = @id', { id: session.id });
    const currentFavs = data[0]?.favoritos || '';
    let favList = currentFavs ? currentFavs.split(',').map(x => x.trim()).filter(Boolean) : [];

    if (isFav) {
      if (!favList.includes(rid.toString())) favList.push(rid.toString());
    } else {
      favList = favList.filter(id => id !== rid.toString());
    }

    const newFavsStr = favList.join(',');

    // 2. Update DB
    const pool = await getDbConnection();
    await pool.request()
      .input('favs', sql.NVarChar, newFavsStr)
      .input('id', sql.Int, session.id)
      .query('UPDATE Usuario SET favoritos = @favs WHERE id = @id');

    return NextResponse.json({ ok: true, favoritos: newFavsStr });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
