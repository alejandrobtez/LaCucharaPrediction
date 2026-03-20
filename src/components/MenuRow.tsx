'use client';

import { Utensils, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MenuRow({ title, items }: { title: string, items: any[] }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="mb-12">
      <h2 className="text-xl md:text-2xl font-medium mb-4 px-4 sm:px-12 text-netflix-cornsilk">
        {title}
      </h2>
      <div className="relative group">
        <div className="flex gap-4 overflow-x-auto px-4 sm:px-12 pb-8 pt-2 hide-scroll-bar snap-x">
          {items.map((item, i) => (
            <motion.div 
              key={item.id}
              whileHover={{ scale: 1.05, zIndex: 10 }}
              className="snap-start shrink-0 relative w-[240px] md:w-[300px] h-[160px] md:h-[200px] rounded-md bg-netflix-black overflow-hidden cursor-pointer group/card transition-all duration-300 shadow-lg border border-white/5"
            >
              <img 
                src={item.imagen_perfil?.length > 15 ? `data:image/jpeg;base64,${item.imagen_perfil}` : "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80"}
                alt={item.nombre}
                className="w-full h-full object-cover transition-opacity duration-300 group-hover/card:opacity-40"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-transparent to-transparent opacity-80" />
              
              <div className="absolute bottom-0 left-0 p-4 w-full">
                <h3 className="text-lg font-bold text-white drop-shadow-md">{item.nombre}</h3>
                {item.precio && <p className="text-netflix-caramel font-medium">{item.precio} €</p>}
              </div>

              {/* Hover content */}
              <div className="absolute inset-0 p-4 opacity-0 group-hover/card:opacity-100 flex flex-col justify-center items-center text-center transition-opacity duration-300 z-20">
                <Utensils className="w-8 h-8 text-netflix-olive mb-2" />
                <p className="text-xs text-gray-200 line-clamp-3">
                  {item.descripcion || "Restaurante con menú disponible hoy."}
                </p>
                <div className="mt-4 flex gap-2">
                  <button className="bg-white text-netflix-black px-4 py-1.5 rounded-sm font-semibold text-sm hover:bg-gray-200">
                    Ver Menú
                  </button>
                  <button className="border border-white/40 p-1.5 rounded-full hover:bg-white/10">
                    <Heart className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <style jsx global>{`
        .hide-scroll-bar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scroll-bar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
