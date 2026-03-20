import { getSession } from '@/app/actions/auth';
import { queryDb } from '@/lib/db';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function FavoritosPage() {
  const session = await getSession();
  if (!session || session.role !== 'oficinista') redirect('/');

  // 1. Get favorite IDs
  const user = await queryDb<any>('SELECT favoritos FROM Usuario WHERE id = @id', { id: session.id });
  const favsRaw = user[0]?.favoritos || '';
  const favIds = favsRaw ? favsRaw.split(',').map((x: string) => parseInt(x)).filter((n: number) => !isNaN(n)) : [];

  if (favIds.length === 0) {
    return (
      <div>
        <h1 className="font-serif text-4xl mb-2">Mis Favoritos</h1>
        <p className="text-slate-500 mb-8">Los restaurantes que has marcado para seguir de cerca.</p>
        <div className="bg-sky-50 p-12 text-center rounded-3xl border border-sky-100">
           <p className="text-sky-600 mb-6">Aún no tienes favoritos. En "Menús Disponibles" pulsa el ❤️ de los restaurantes que más te gusten.</p>
           <Link href="/cliente/menus" className="btn-primary inline-block">Explorar menús</Link>
        </div>
      </div>
    );
  }

  // 2. Get restaurant details and their menu today if any
  const restaurants = await Promise.all(favIds.map(async (rid: number) => {
    const data = await queryDb<any>(`
      SELECT id, nombre, descripcion, telefono, sitio_web, imagenes_local 
      FROM Restaurante 
      WHERE id = @rid
    `, { rid });
    
    if (data.length === 0) return null;
    const rest = data[0];

    const menuHoy = await queryDb<any>(`
      SELECT id, precio 
      FROM MenuDiario 
      WHERE restaurante_id = @rid AND CONVERT(date, fecha) = CONVERT(date, GETDATE())
    `, { rid });

    return { ...rest, menu_hoy: menuHoy[0] || null };
  }));

  const activeRests = restaurants.filter(Boolean);

  return (
    <div>
      <h1 className="font-serif text-4xl mb-2">Mis Favoritos</h1>
      <p className="text-slate-500 mb-8">Los restaurantes que has marcado para seguir de cerca.</p>

      <div className="grid grid-cols-1 gap-4">
        {activeRests.map((r: any) => (
          <div key={r.id} className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex-1">
              <h3 className="font-serif text-2xl mb-1 flex items-center gap-2">
                <span className="text-rose-500">❤️</span> {r.nombre}
              </h3>
              <p className="text-slate-500 text-sm mb-3">
                {r.descripcion ? r.descripcion.slice(0, 100) + (r.descripcion.length > 100 ? '...' : '') : 'Sin descripción.'}
              </p>
              
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-400">
                 {r.telefono && <span>📞 {r.telefono}</span>}
                 {r.sitio_web && <span>🌐 {r.sitio_web}</span>}
              </div>
            </div>

            <div className="flex flex-col items-end gap-3 shrink-0">
               {r.menu_hoy ? (
                 <div className="text-right">
                    <p className="text-emerald-500 font-bold text-sm mb-1 flex items-center gap-1">✅ Menú hoy disponible</p>
                    <p className="text-slate-900 font-serif text-2xl">{parseFloat(r.menu_hoy.precio).toFixed(2)}€</p>
                    <Link href={`/cliente/menus/${r.menu_hoy.id}`} className="mt-2 btn-primary py-2 px-6 text-sm">Ver menú</Link>
                 </div>
               ) : (
                 <div className="text-right">
                    <p className="text-rose-400 font-semibold text-xs mb-3 flex items-center gap-1 justify-end">❌ Sin menú hoy</p>
                    <button className="btn-secondary py-2 px-6 text-sm opacity-50 cursor-not-allowed">No disponible</button>
                 </div>
               )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
