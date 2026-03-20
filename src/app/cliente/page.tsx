import { getSession } from '@/app/actions/auth';
import { queryDb } from '@/lib/db';
import Link from 'next/link';

export default async function ClienteHome() {
  const session = await getSession();

  // Preferencias del usuario
  const userData = await queryDb<any>('SELECT nombre, preferencias_dieteticas FROM Usuario WHERE id = @id', { id: session.id });
  const user = userData[0] || {};
  const prefsRaw = user.preferencias_dieteticas || '';
  const userPrefs: string[] = prefsRaw ? prefsRaw.split(',').map((p: string) => p.trim()).filter(Boolean) : [];

  // Menús del día con más info para la IA
  const menus = await queryDb<any>(`
    SELECT m.id as menu_id, r.id as restaurante_id, r.nombre as restaurante_nombre, 
           r.descripcion as restaurante_descripcion, r.ubicacion,
           m.precio, m.etiquetas, r.imagenes_local
    FROM MenuDiario m 
    JOIN Restaurante r ON m.restaurante_id = r.id
    WHERE CONVERT(date, m.fecha) = CONVERT(date, GETDATE())
  `);

  // Algoritmo de Recomendación Inteligente
  const scored = menus.map((m: any) => {
    let score = 0;
    const content = `${m.restaurante_nombre} ${m.restaurante_descripcion} ${m.etiquetas} ${m.ubicacion}`.toLowerCase();
    
    userPrefs.forEach(pref => {
      const p = pref.toLowerCase();
      if (content.includes(p)) score += 2; // Match directo en tags o descripción
      
      // Bonus por proximidad conceptual (simplificado)
      if (p === 'vegano' && (content.includes('vegetal') || content.includes('ensalada'))) score += 1;
      if (p === 'carne' && (content.includes('parrilla') || content.includes('asado'))) score += 1;
    });

    return { ...m, score };
  }).sort((a: any, b: any) => b.score - a.score);

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-12">
        <h1 className="main-title text-5xl mb-3">¡Hola, {session.name}!</h1>
        <p className="text-slate-500 text-lg">Descubre los sabores que mejor encajan contigo hoy.</p>
      </header>

      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
           <h2 className="font-serif text-2xl">Recomendados para ti</h2>
           <Link href="/cliente/perfil" className="text-xs font-bold text-light-bronze uppercase tracking-widest hover:text-bronze-dark transition-colors">
              Ajustar preferencias →
           </Link>
        </div>

        {userPrefs.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {userPrefs.map(p => (
              <span key={p} className="px-4 py-1.5 bg-sage/20 text-sage-dark border border-sage/30 rounded-full text-xs font-bold">
                {p}
              </span>
            ))}
          </div>
        )}

        {scored.length === 0 ? (
          <div className="ai-card text-center py-12">
            <p className="text-light-bronze font-bold text-lg mb-2">Hoy no hay menús publicados en tu zona.</p>
            <p className="text-bronze-dark/60 text-sm">Vuelve mañana para descubrir nuevas recomendaciones.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {scored.map((m: any) => {
              const matchesPreferencias = m.score > 0;
              return (
                <Link key={m.menu_id} href={`/cliente/menus/${m.menu_id}`} className="group">
                  <div className="restaurant-card bg-slate-900 border-none relative">
                    {/* Imagen de fondo */}
                    <div className="absolute inset-0 z-0">
                       <img 
                        src={m.imagenes_local || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80'} 
                        alt={m.restaurante_nombre} 
                        className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                    </div>

                    <div className="relative z-10 p-8">
                      {matchesPreferencias && (
                        <div className="inline-block bg-dry-sage text-sage-dark px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 animate-pulse">
                          ✨ 100% Para ti
                        </div>
                      )}
                      
                      <h3 className="text-white font-serif text-3xl mb-1">{m.restaurante_nombre}</h3>
                      <p className="text-cornsilk/60 text-xs mb-4 flex items-center gap-1">
                         📍 {m.ubicacion || 'Zona Azca'}
                      </p>

                      <div className="flex items-center justify-between mt-6">
                         <div className="flex gap-2">
                            {(m.etiquetas || '').split(',').slice(0, 2).map((etq: string) => (
                              <span key={etq} className="text-[10px] text-white/50 border border-white/20 px-2 py-0.5 rounded-lg">
                                {etq.trim()}
                              </span>
                            ))}
                         </div>
                         <p className="text-dry-sage font-black text-xl">{parseFloat(m.precio).toFixed(2)}€</p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
