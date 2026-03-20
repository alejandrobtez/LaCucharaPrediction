'use server';

import { cookies } from 'next/headers';
import { queryDb } from '@/lib/db';
import { redirect } from 'next/navigation';

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyAm7dAuKASfALOyluViHWuJ9apOZyTtawY";

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string; // 'Cliente' o 'Restaurante'

  // Master passwords exactas de la versión anterior
  if (password === 'admin' || password === 'rest') {
    if (password === 'admin' && role === 'Cliente') {
      const users = await queryDb<{id: number, nombre: string}>("SELECT id, nombre FROM Usuario WHERE LOWER(correo) = @email", { email: email.toLowerCase() });
      if (users.length > 0) {
        setSessionCookie({ id: users[0].id, name: users[0].nombre, role: 'oficinista' });
        redirect('/cliente');
      }
    }
    if (password === 'rest' && role === 'Restaurante') {
      const rests = await queryDb<{id: number, nombre: string, aforo_maximo: number}>("SELECT id, nombre, aforo_maximo FROM Restaurante WHERE LOWER(correo) = @email", { email: email.toLowerCase() });
      if (rests.length > 0) {
        setSessionCookie({ id: rests[0].id, name: rests[0].nombre, role: 'restaurante', aforo: rests[0].aforo_maximo });
        redirect('/restaurante');
      }
    }
    return { error: 'Credenciales/Rol incorrectos para bypass.' };
  }

  // Firebase Auth (como en Streamlit)
  try {
    const fbRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    });
    const fbData = await fbRes.json();
    if (!fbRes.ok) return { error: fbData.error?.message || 'Error de Firebase' };

    const userEmail = (fbData.email || email).toLowerCase();

    if (role === 'Cliente') {
      const users = await queryDb<{id: number, nombre: string}>("SELECT id, nombre FROM Usuario WHERE LOWER(correo) = @email", { email: userEmail });
      if (users.length > 0) {
        setSessionCookie({ id: users[0].id, name: users[0].nombre, role: 'oficinista' });
        redirect('/cliente');
      }
    } else {
      const rests = await queryDb<{id: number, nombre: string, aforo_maximo: number}>("SELECT id, nombre, aforo_maximo FROM Restaurante WHERE LOWER(correo) = @email", { email: userEmail });
      if (rests.length > 0) {
        setSessionCookie({ id: rests[0].id, name: rests[0].nombre, role: 'restaurante', aforo: rests[0].aforo_maximo });
        redirect('/restaurante');
      }
    }
    return { error: 'Tu cuenta registrada no coincide con el rol seleccionado.' };
  } catch (err: any) {
    if (err.message === 'NEXT_REDIRECT') throw err; // Permitir que redirect() funcione
    return { error: 'Error del servidor: ' + err.message };
  }
}

export async function logoutAction() {
  cookies().delete('session');
  redirect('/');
}

// Utils de session
function setSessionCookie(data: any) {
  cookies().set('session', JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 semana
    path: '/',
  });
}

export async function getSession() {
  const session = cookies().get('session');
  if (!session) return null;
  return JSON.parse(session.value);
}
