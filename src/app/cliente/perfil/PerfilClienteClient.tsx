'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PerfilClienteClient({ session, perfil }: { session: any; perfil: any }) {
  const router = useRouter();
  const [nombre, setNombre] = useState(perfil.nombre || '');
  const [sobreMi, setSobreMi] = useState(perfil.sobre_mi || '');
  const [prefDiet, setPrefDiet] = useState<string[]>(
    perfil.preferencias_dieteticas ? perfil.preferencias_dieteticas.split(',').map((p: string) => p.trim()).filter(Boolean) : []
  );
  const [imgUrl, setImgUrl] = useState(perfil.imagen_perfil || '');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const OPTIONS = ["Vegano", "Vegetariano", "Sin Gluten", "Sin Lácteos", "Carne", "Pescado", "Mediterráneo", "Asiático", "Picante", "Sin Mariscos"];

  const togglePref = (p: string) => {
    setPrefDiet(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true); setMsg('Subiendo...');
    const fd = new FormData(); fd.append('file', file);
    try {
      const res = await fetch('/api/perfil/cliente/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) { setImgUrl(data.path); setMsg('✅ Foto actualizada.'); router.refresh(); }
      else setMsg('❌ ' + data.error);
    } catch { setMsg('❌ Error de red.'); }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMsg('');
    const res = await fetch('/api/perfil/cliente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, sobre_mi: sobreMi, preferencias_dieteticas: prefDiet.join(',') })
    });
    if (res.ok) { setMsg('✅ Perfil actualizado.'); router.refresh(); }
    else setMsg('❌ Error al guardar.');
    setLoading(false);
  };

  return (
    <div>
      <h1 className="font-serif text-4xl mb-2">Mi Perfil</h1>
      <p className="text-slate-500 mb-8">Administra tus preferencias gastronómicas y cómo te ven los demás.</p>

      {msg && <div className={`p-4 rounded-xl mb-6 shadow-sm border border-emerald-100 ${msg.includes('✅') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
         {msg}
      </div>}

      <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-10 items-start">
           {/* Avatar */}
           <div className="relative group shrink-0">
              <img 
                src={imgUrl || 'https://via.placeholder.com/150?text=YO'} 
                alt="Yo" 
                className="w-32 h-32 rounded-full object-cover border-4 border-beige shadow-lg" 
              />
              <button 
                onClick={() => document.getElementById('avatar-input')?.click()}
                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                 📷 Editar
              </button>
              <input 
                id="avatar-input" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleUpload} 
              />
           </div>

           <div className="flex-1 w-full space-y-8">
              <div className="flex flex-col gap-2">
                 <label className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">Nombre Completo</label>
                 <input 
                    type="text"
                    value={nombre} 
                    onChange={e => setNombre(e.target.value)}
                    placeholder="Tu nombre..."
                    className="w-full text-xl font-bold p-4 rounded-2xl border-slate-200 focus:border-sky-500 focus:ring-0"
                 />
              </div>

              <div className="flex flex-col gap-2">
                 <label className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">Sobre mí</label>
                 <textarea 
                    value={sobreMi} 
                    onChange={e => setSobreMi(e.target.value)}
                    placeholder="Cuéntanos un poco de ti..."
                    className="w-full text-lg font-serif p-4 rounded-2xl border-slate-200 focus:border-sky-500 focus:ring-0"
                    rows={3}
                 />
              </div>

              <div className="flex flex-col gap-4">
                 <div className="flex items-center gap-3">
                    <label className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">Mis preferencias dietéticas</label>
                    <span className="text-[10px] px-2 py-0.5 bg-sky-200 text-sky-600 rounded-md font-black">IMPORTANTE</span>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {OPTIONS.map(opt => (
                       <button 
                         key={opt}
                         onClick={() => togglePref(opt)}
                         className={`px-6 py-2 rounded-full text-sm font-bold border transition-all ${
                             prefDiet.includes(opt) 
                             ? 'bg-sky-500 border-sky-400 text-white shadow-lg' 
                             : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-sky-300'
                         }`}
                       >
                          {opt}
                       </button>
                    ))}
                 </div>
              </div>

              <div className="pt-4">
                 <button onClick={handleSave} disabled={loading} className="btn-primary w-full md:w-auto px-12 py-4">
                    {loading ? 'Guardando...' : '💾 Guardar cambios'}
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
