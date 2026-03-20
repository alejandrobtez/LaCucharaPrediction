'use client';

import { useState } from 'react';
import { loginAction } from './actions/auth';

export default function LoginPage() {
  const [role, setRole] = useState<'Cliente' | 'Restaurante'>('Cliente');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [registerData, setRegisterData] = useState({
    nombre: '', email: '', password: '', aforo: 50
  });
  const [regMsg, setRegMsg] = useState('');

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    const formData = new FormData(e.currentTarget);
    formData.append('role', role);
    try {
      const res = await loginAction(formData);
      if (res?.error) setErrorMsg(res.error);
    } catch (err: any) {
      if (err?.message !== 'NEXT_REDIRECT') setErrorMsg('Error de conexión.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setRegMsg('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...registerData, role }),
      });
      const data = await res.json();
      if (res.ok) {
        setRegMsg('✅ Cuenta creada. Ya puedes iniciar sesión.');
        setMode('login');
      } else {
        setRegMsg('❌ ' + (data.error || 'Error al registrar.'));
      }
    } catch { setRegMsg('❌ Error de red.'); } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{
      background: 'linear-gradient(-45deg, #f8fafc, #e0f2fe, #bae6fd, #f1f5f9)',
      backgroundSize: '400% 400%',
      animation: 'gradientShift 15s ease infinite'
    }}>
      <style>{`
        @keyframes gradientShift {
          0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%}
        }
      `}</style>

      <div style={{
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(24px)',
        borderRadius: '28px',
        padding: '3rem 2.5rem',
        width: '100%',
        maxWidth: '460px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.08)',
        border: '1px solid rgba(255,255,255,0.9)',
        margin: '1rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '3.2rem', color: '#0284c7', margin: 0 }}>
            La Cuchara
          </h1>
          <p style={{ color: '#64748b', marginTop: '0.3rem', fontSize: '1rem' }}>
            Tu plataforma de menús del día en Azca
          </p>
        </div>

        {/* Modo: Login / Registro */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '12px', padding: '4px', marginBottom: '1.5rem' }}>
          {(['login', 'register'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1,
              padding: '0.6rem',
              borderRadius: '10px',
              border: 'none',
              background: mode === m ? '#fff' : 'transparent',
              color: mode === m ? '#0284c7' : '#64748b',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: mode === m ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.2s'
            }}>
              {m === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
            </button>
          ))}
        </div>

        {/* Role Toggle */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '12px', padding: '4px', marginBottom: '1.5rem' }}>
          {(['Cliente', 'Restaurante'] as const).map(r => (
            <button key={r} onClick={() => setRole(r)} style={{
              flex: 1,
              padding: '0.6rem',
              borderRadius: '10px',
              border: 'none',
              background: role === r ? '#0ea5e9' : 'transparent',
              color: role === r ? '#fff' : '#64748b',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              {r === 'Cliente' ? '🧑 Comensal' : '🍴 Restaurante'}
            </button>
          ))}
        </div>

        {errorMsg && (
          <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '10px', padding: '0.75rem', marginBottom: '1rem', color: '#e11d48', fontSize: '0.875rem' }}>
            {errorMsg}
          </div>
        )}
        {regMsg && (
          <div style={{ background: regMsg.startsWith('✅') ? '#f0fdf4' : '#fff1f2', border: `1px solid ${regMsg.startsWith('✅') ? '#bbf7d0' : '#fecdd3'}`, borderRadius: '10px', padding: '0.75rem', marginBottom: '1rem', color: regMsg.startsWith('✅') ? '#16a34a' : '#e11d48', fontSize: '0.875rem' }}>
            {regMsg}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label>Correo electrónico</label>
              <input name="email" type="email" required placeholder="tu@correo.com" />
            </div>
            <div>
              <label>Contraseña</label>
              <input name="password" type="password" required placeholder="••••••••" />
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label>{role === 'Cliente' ? 'Tu nombre' : 'Nombre del restaurante'}</label>
              <input type="text" required placeholder={role === 'Cliente' ? 'Ej: Ana García' : 'Ej: Restaurante Azca'}
                value={registerData.nombre} onChange={e => setRegisterData(p => ({...p, nombre: e.target.value}))} />
            </div>
            {role === 'Restaurante' && (
              <div>
                <label>Aforo del local</label>
                <input type="number" min={1} value={registerData.aforo}
                  onChange={e => setRegisterData(p => ({...p, aforo: parseInt(e.target.value)}))} />
              </div>
            )}
            <div>
              <label>Correo electrónico</label>
              <input type="email" required placeholder="tu@correo.com"
                value={registerData.email} onChange={e => setRegisterData(p => ({...p, email: e.target.value}))} />
            </div>
            <div>
              <label>Contraseña</label>
              <input type="password" required placeholder="Mínimo 6 caracteres"
                value={registerData.password} onChange={e => setRegisterData(p => ({...p, password: e.target.value}))} />
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" style={{ flex: 1, fontSize: '0.875rem' }}>
            🔍 Google (próximamente)
          </button>
          <button className="btn-secondary" style={{ flex: 1, fontSize: '0.875rem' }}>
            📱 Teléfono (próximamente)
          </button>
        </div>
      </div>
    </div>
  );
}
