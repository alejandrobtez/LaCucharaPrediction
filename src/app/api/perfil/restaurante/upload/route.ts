import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDbConnection } from '@/lib/db';
import sql from 'mssql';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const sessionStr = cookies().get('session')?.value;
    if (!sessionStr) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const session = JSON.parse(sessionStr);

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string; // 'perfil' or 'local'

    if (!file) return NextResponse.json({ error: 'Falta archivo' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `${session.id}_${type}_${crypto.randomUUID().slice(0, 8)}${path.extname(file.name)}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const fullPath = path.join(uploadDir, filename);

    await fs.writeFile(fullPath, buffer);
    const publicPath = `/uploads/${filename}`;

    const pool = await getDbConnection();
    const col = type === 'perfil' ? 'imagen_perfil' : 'imagenes_local';
    
    // Dynamically building column name is risky if unchecked, but we check against list
    if (!['imagen_perfil', 'imagenes_local'].includes(col)) {
        return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    }

    await pool.request()
      .input('path', sql.NVarChar, publicPath)
      .input('id', sql.Int, session.id)
      .query(`UPDATE Restaurante SET ${col} = @path WHERE id = @id`);

    return NextResponse.json({ ok: true, path: publicPath });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
