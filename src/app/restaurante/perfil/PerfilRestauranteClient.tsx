'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PerfilRestauranteClient({ session, perfil }: { session: any; perfil: any }) {
  const router = useRouter();
  const [nombre, setNombre] = useState(perfil.nombre || session.name || '');
  const [aforo, setAforo] = useState(perfil.aforo_maximo || session.aforo || 50);
  const [desc, setDesc] = useState(perfil.descripcion || '');
  const [tel, setTel] = useState(perfil.telefono || '');
  const [web, setWeb] = useState(perfil.sitio_web || '');
  const [ubicacion, setUbicacion] = useState(perfil.ubicacion || '');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setMsg('');
    try {
      const res = await fetch('/api/perfil/restaurante', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, aforo, descripcion: desc, telefono: tel, sitio_web: web, ubicacion }),
      });
      const data = await res.json();
      if (res.ok) { setMsg('✅ Perfil actualizado correctamente.'); router.refresh(); }
      else setMsg('❌ ' + (data.error || 'Error al guardar.'));
    } catch {
      setMsg('❌ Error de red.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="main-title text-4xl mb-2">Perfil del Restaurante</h1>
      <p className="text-slate-500 mb-10">Gestiona la información que tus clientes verán al explorar tu menú.</p>

      {msg && (
        <div className={`p-4 rounded-2xl mb-8 border shadow-sm ${msg.startsWith('✅') ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
          {msg}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-[40px] border border-beige p-10 shadow-sm space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <h3 className="font-serif text-2xl text-sage-dark">🏪 Datos Básicos</h3>
            
            <div className="space-y-2">
              <label>Nombre Comercial</label>
              <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: La Cuchara de Azca" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label>👥 Aforo Máx.</label>
                <input type="number" min={1} value={aforo} onChange={e => setAforo(parseInt(e.target.value))} />
              </div>
              <div className="space-y-2">
                <label>📞 Teléfono</label>
                <input type="text" value={tel} onChange={e => setTel(e.target.value)} placeholder="+34 91..." />
              </div>
            </div>

            <div className="space-y-2">
              <label>📍 Ubicación (Zona/Barrio)</label>
              <input type="text" value={ubicacion} onChange={e => setUbicacion(e.target.value)} placeholder="Ej: Azca, Madrid" />
            </div>

            <div className="space-y-2">
              <label>🌐 Sitio Web</label>
              <input type="text" value={web} onChange={e => setWeb(e.target.value)} placeholder="www.tuweb.com" />
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="font-serif text-2xl text-sage-dark">📸 Identidad Visual</h3>
            
            <div className="space-y-4">
               <div className="p-6 bg-cornsilk/30 rounded-3xl border border-beige border-dashed">
                  <label className="mb-2">Logo o foto de perfil</label>
                  <input type="file" accept="image/png,image/jpeg" className="text-sm cursor-pointer" onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setLoading(true);
                    const fd = new FormData(); fd.append('file', f); fd.append('type', 'perfil');
                    await fetch('/api/perfil/restaurante/upload', { method: 'POST', body: fd });
                    setMsg('✅ Foto actualizada.');
                    setLoading(false);
                    router.refresh();
                  }} />
               </div>

               <div className="p-6 bg-papaya-whip/30 rounded-3xl border border-papaya border-dashed">
                  <label className="mb-2">Foto del local / Hero</label>
                  <input type="file" accept="image/png,image/jpeg" className="text-sm cursor-pointer" onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setLoading(true);
                    const fd = new FormData(); fd.append('file', f); fd.append('type', 'local');
                    await fetch('/api/perfil/restaurante/upload', { method: 'POST', body: fd });
                    setMsg('✅ Imagen del local actualizada.');
                    setLoading(false);
                    router.refresh();
                  }} />
               </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label>📖 Descripción del restaurante</label>
          <textarea 
            value={desc} 
            onChange={e => setDesc(e.target.value)} 
            rows={4}
            placeholder="Cuenta la historia de tu cocina, vuestra especialidad y ambiente..."
            className="w-full"
          />
        </div>

        <div className="pt-4">
          <button type="submit" className="btn-primary w-full md:w-auto px-16 py-5 text-lg" disabled={loading}>
            {loading ? 'Guardando...' : '💾 Guardar todos los cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
