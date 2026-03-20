import { getSession } from '@/app/actions/auth';
import { queryDb } from '@/lib/db';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function DetalleMenuPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== 'oficinista') redirect('/');

  const menuId = parseInt(params.id);

  // 1. Get menu details including location
  const menuRes = await queryDb<any>(`
    SELECT m.id, m.precio, m.fecha, m.etiquetas, r.id as restaurante_id, r.nombre as restaurante_nombre, 
           r.descripcion as restaurante_descripcion, r.telefono, r.sitio_web, r.imagenes_local, r.imagen_perfil, r.ubicacion
    FROM MenuDiario m
    JOIN Restaurante r ON m.restaurante_id = r.id
    WHERE m.id = @mid
  `, { mid: menuId });

  if (menuRes.length === 0) {
    return (
      <div className="text-center py-24 px-4">
        <h1 className="main-title text-5xl mb-6">Menú no encontrado</h1>
        <p className="text-slate-500 mb-10 italic">Lo sentimos, este sabor se ha escapado del mapa.</p>
        <Link href="/cliente/menus" className="btn-primary inline-flex">Explorar otros sabores</Link>
      </div>
    );
  }

  const m = menuRes[0];

  // 2. Get plates
  const platos = await queryDb<any>(`
    SELECT p.nombre, p.categoria, p.ingredientes_principales
    FROM Plato p
    JOIN MenuPlato mp ON p.id = mp.plato_id
    WHERE mp.menu_id = @mid
    ORDER BY CASE p.categoria WHEN 'Primero' THEN 1 WHEN 'Segundo' THEN 2 WHEN 'Postre' THEN 3 ELSE 4 END
  `, { mid: menuId });

  const categories = ["Primero", "Segundo", "Postre"];

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <Link href="/cliente" className="text-light-bronze font-bold mb-8 inline-flex items-center gap-3 hover:-translate-x-2 transition-transform">
        <span>⬅️</span> Volver al inicio
      </Link>

      {/* Hero / Cover */}
      <div className="relative h-[450px] rounded-[50px] overflow-hidden mb-12 shadow-2xl bg-slate-100 border border-beige">
        {m.imagenes_local ? (
          <img src={m.imagenes_local} alt={m.restaurante_nombre} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-beige to-papaya-whip" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="absolute bottom-16 left-16 right-16 flex items-end justify-between">
            <div className="max-w-2xl">
               <p className="text-dry-sage font-black tracking-[0.2em] text-[10px] uppercase mb-4">📍 {m.ubicacion || 'Zona Azca, Madrid'}</p>
               <h1 className="font-serif text-6xl text-white mb-6 leading-tight">{m.restaurante_nombre}</h1>
               <p className="text-cornsilk/80 text-lg leading-relaxed mb-4 italic line-clamp-2">
                 {m.restaurante_descripcion || 'Un espacio acogedor para disfrutar del mejor menú diario de la zona.'}
               </p>
            </div>
            {m.imagen_perfil && (
              <div className="hidden lg:block">
                 <img 
                   src={m.imagen_perfil} 
                   alt="logo" 
                   className="w-32 h-32 rounded-[30px] border-4 border-white shadow-2xl object-cover transform rotate-3" 
                 />
              </div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Cuerpo del Menú */}
        <div className="lg:col-span-2 space-y-10">
           <div className="bg-white p-12 rounded-[50px] border border-beige shadow-sm relative">
             <div className="flex justify-between items-start mb-16">
                <div>
                   <h2 className="font-serif text-4xl mb-2 text-sage-dark">Menú de hoy</h2>
                   <p className="text-slate-400 text-sm font-medium">Actualizado hace unas horas</p>
                </div>
                <div className="bg-cornsilk text-center px-10 py-4 rounded-[30px] border border-papaya shadow-inner">
                   <p className="text-[10px] font-black text-bronze-dark uppercase tracking-widest mb-1">Precio Fijo</p>
                   <p className="text-4xl font-serif text-light-bronze">{parseFloat(m.precio).toFixed(2)}€</p>
                </div>
             </div>

             <div className="space-y-12">
                {categories.map(cat => {
                   const catPlatos = platos.filter((p: any) => p.categoria === cat);
                   if (catPlatos.length === 0) return null;
                   return (
                     <div key={cat} className="space-y-6">
                        <div className="flex items-center gap-4">
                           <div className="h-px flex-1 bg-beige" />
                           <h3 className="text-sage-dark font-black text-xs uppercase tracking-[0.3em]">{cat}s</h3>
                           <div className="h-px flex-1 bg-beige" />
                        </div>
                        <ul className="grid grid-cols-1 gap-6">
                           {catPlatos.map((p: any, i: number) => (
                             <li key={i} className="text-center group">
                                <span className="block text-slate-800 font-bold text-2xl mb-2 group-hover:text-light-bronze transition-colors">{p.nombre}</span>
                                {p.ingredientes_principales && (
                                  <span className="text-slate-400 text-xs italic tracking-wide">
                                     {p.ingredientes_principales}
                                  </span>
                                )}
                             </li>
                           ))}
                        </ul>
                     </div>
                   );
                })}
             </div>

             {m.etiquetas && (
                <div className="mt-20 pt-10 border-t border-beige flex flex-col items-center">
                   <p className="text-[10px] font-black text-bronze-dark uppercase tracking-widest mb-6">Detalles del Menú (Alérgenos / Estilo)</p>
                   <div className="flex flex-wrap justify-center gap-3">
                      {m.etiquetas.split(',').map((t: string) => (
                        <span key={t} className="px-5 py-2 bg-papaya-whip/50 text-bronze-dark border border-papaya rounded-2xl text-[10px] font-bold uppercase tracking-widest">
                           {t.trim()}
                        </span>
                      ))}
                   </div>
                </div>
             )}
           </div>
        </div>

        {/* Sidebar Restaurante */}
        <div className="space-y-8">
           <div className="bg-white p-10 rounded-[50px] text-slate-900 shadow-xl space-y-10 border border-beige">
              <h3 className="font-serif text-3xl text-sage-dark">Visítanos</h3>
              
              <div className="space-y-8">
                 <div className="flex gap-5">
                    <span className="text-3xl">📍</span>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Ubicación</p>
                       <p className="text-sm font-bold leading-relaxed">{m.ubicacion || 'Zona Azca, Madrid'}</p>
                    </div>
                 </div>
                 <div className="flex gap-5">
                    <span className="text-3xl">📞</span>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Reservas</p>
                       <p className="text-sm font-bold leading-relaxed">{m.telefono || 'Ver sitio web'}</p>
                    </div>
                 </div>
                 <div className="flex gap-5">
                    <span className="text-3xl text-light-bronze">🔗</span>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Web Oficial</p>
                       <p className="text-sm font-bold leading-relaxed break-all">{m.sitio_web || 'No disponible'}</p>
                    </div>
                 </div>
              </div>

              <Link 
                href={m.sitio_web ? (m.sitio_web.startsWith('http') ? m.sitio_web : `https://${m.sitio_web}`) : '#'} 
                target="_blank"
                className="w-full bg-light-bronze text-white font-black tracking-widest uppercase text-xs py-5 rounded-[25px] flex items-center justify-center gap-3 hover:bg-bronze-dark transition-colors shadow-lg"
              >
                📅 Ir al sitio web
              </Link>
           </div>
           
           <div className="ai-card p-8">
              <p className="text-light-bronze font-black text-[10px] uppercase tracking-widest mb-2">Sobre {m.restaurante_nombre}</p>
              <p className="text-bronze-dark text-sm leading-relaxed italic">
                {m.restaurante_descripcion || 'Un espacio gastronómico que cuida el detalle para ofrecer el mejor menú de Madrid.'}
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
