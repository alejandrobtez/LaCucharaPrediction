'use client';

import { useState } from 'react';
import Link from 'next/link';

type MenuCard = {
  menu_id: number;
  restaurante_id: number;
  restaurante_nombre: string;
  precio: number;
  etiquetas: string;
};

export default function MenusDisponiblesClient({ 
  menus, 
  initialFavIds, 
  userId 
}: { 
  menus: MenuCard[], 
  initialFavIds: number[], 
  userId: number 
}) {
  const [favIds, setFavIds] = useState<number[]>(initialFavIds);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const ALL_TAGS = ["Vegano", "Vegetariano", "Sin Gluten", "Sin Lácteos", "Carne", "Pescado", "Mediterráneo", "Asiático", "Picante", "Sin Mariscos"];

  const toggleFav = async (rid: number) => {
    const isFav = favIds.includes(rid);
    const newFavs = isFav ? favIds.filter(id => id !== rid) : [...favIds, rid];
    setFavIds(newFavs);

    await fetch('/api/favoritos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rid, isFav: !isFav })
    });
  };

  const filteredMenus = menus.filter(m => {
    const matchesSearch = m.restaurante_nombre.toLowerCase().includes(search.toLowerCase());
    const mTags = (m.etiquetas || '').split(',').map(t => t.trim().toLowerCase());
    const matchesTags = filterTags.length === 0 || filterTags.every(t => mTags.includes(t.toLowerCase()));
    return matchesSearch && matchesTags;
  });

  const FOOD_IMGS = [
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&w=600&q=80',
  ];

  return (
    <div>
      <h1 className="font-serif text-4xl mb-2">Menús Disponibles</h1>
      <p className="text-slate-500 mb-8">Todos los restaurantes con menú publicado hoy.</p>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 mb-8 shadow-sm">
        <label className="mb-2 block">🔍 Buscar restaurante</label>
        <input 
          type="text" 
          placeholder="Escribe el nombre..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          className="mb-4"
        />

        <label className="mb-2 block">🏷️ Filtrar por etiquetas</label>
        <div className="flex flex-wrap gap-2">
          {ALL_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => setFilterTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                filterTags.includes(tag) 
                ? 'bg-sky-500 text-white border-sky-500 shadow-md' 
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-sky-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {filteredMenus.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <p className="text-slate-400">No se encontraron menús que coincidan con tus filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredMenus.map((m, i) => {
            const isFav = favIds.includes(m.restaurante_id);
            const bg = FOOD_IMGS[i % FOOD_IMGS.length];
            return (
              <div key={m.menu_id} className="relative group">
                <Link href={`/cliente/menus/${m.menu_id}`} className="block overflow-hidden rounded-3xl relative h-[280px] group shadow-lg transition-transform hover:-translate-y-1">
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundImage: `url('${bg}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 p-6 w-full">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(m.etiquetas || '').split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-sky-500/20 backdrop-blur-md border border-sky-400/30 text-sky-100 text-[10px] font-bold rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="font-serif text-2xl text-white mb-1">{m.restaurante_nombre}</h3>
                    <p className="text-sky-400 font-bold text-lg">{m.precio.toFixed(2)}€</p>
                  </div>
                </Link>

                <button 
                  onClick={(e) => { e.preventDefault(); toggleFav(m.restaurante_id); }}
                  className={`absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg backdrop-blur-md border ${
                    isFav 
                    ? 'bg-rose-500 border-rose-400 text-white' 
                    : 'bg-white/20 border-white/30 text-white hover:bg-white/40'
                  }`}
                >
                  <span className="text-xl">{isFav ? '❤️' : '🤍'}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
