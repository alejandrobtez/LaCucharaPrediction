'use server';

import { NextRequest, NextResponse } from 'next/server';

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyAm7dAuKASfALOyluViHWuJ9apOZyTtawY";

export async function POST(req: NextRequest) {
  try {
    const { email, password, role, nombre, aforo } = await req.json();

    // 1. Register on Firebase
    const fbRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    });
    const fbData = await fbRes.json();
    if (!fbRes.ok) return NextResponse.json({ error: fbData.error?.message || 'Firebase error' }, { status: 400 });

    const userEmail = (fbData.email || email).toLowerCase();

    // 2. Insert in SQL Server
    const { getDbConnection } = await import('@/lib/db');
    const sql = await import('mssql');
    const pool = await getDbConnection();
    const request = pool.request();

    if (role === 'Cliente') {
      request.input('n', sql.default.NVarChar, nombre);
      request.input('c', sql.default.NVarChar, userEmail);
      request.input('p', sql.default.NVarChar, password);
      await request.query('INSERT INTO Usuario (nombre, correo, password) VALUES (@n, @c, @p)');
    } else {
      request.input('n', sql.default.NVarChar, nombre);
      request.input('a', sql.default.Int, parseInt(aforo));
      request.input('c', sql.default.NVarChar, userEmail);
      await request.query('INSERT INTO Restaurante (nombre, aforo_maximo, correo) VALUES (@n, @a, @c)');
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
