'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/actions/auth';

interface NavItem { label: string; href: string; icon: string; }

export default function Sidebar({
  userName, avatarSrc, subtitle, navItems, reportEmail = 'ayuda@lacuchara.com'
}: {
  userName: string;
  avatarSrc: string;
  subtitle?: string;
  navItems: NavItem[];
  reportEmail?: string;
}) {
  const pathname = usePathname();

  return (
    <div className="sidebar shadow-2xl border-r-0">
      {/* Logo Premium */}
      <div className="p-8 mb-4">
        <div className="flex flex-col">
          <span className="font-serif text-3xl text-bronze-dark leading-none tracking-tight">
            LaCuchara
          </span>
          <span className="text-[10px] font-bold text-sage-dark mt-1">
            Gourmet Experience
          </span>
        </div>
      </div>

      {/* Perfil Mini */}
      <div className="px-8 mb-8">
        <div className="flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-[24px] border border-beige shadow-sm">
          <img
            src={avatarSrc || 'https://via.placeholder.com/100?text=?'}
            alt="Avatar"
            className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-md shrink-0"
            onError={(e: any) => { e.target.src = 'https://via.placeholder.com/100?text=?'; }}
          />
          <div className="overflow-hidden">
            <p className="font-bold text-sm text-slate-800 truncate">{userName}</p>
            <p className="text-[10px] text-sage-dark font-medium truncate tracking-wide">
              {subtitle ? subtitle.slice(0, 20) : 'Comensal'}
            </p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-6 space-y-1">
        {navItems.map(item => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`flex items-center gap-4 px-5 py-4 rounded-[20px] transition-all duration-300 group ${
                active 
                ? 'bg-light-bronze text-white shadow-lg shadow-light-bronze/20 translate-x-1' 
                : 'text-slate-600 hover:bg-beige hover:text-bronze-dark'
              }`}
            >
              <span className={`text-xl ${active ? 'scale-110' : 'group-hover:scale-110 transition-transform'}`}>
                {item.icon}
              </span>
              <span className={`text-sm font-bold tracking-tight`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Acciones */}
      <div className="p-6 mt-6 space-y-3">
        <a
          href={`mailto:${reportEmail}`}
          className="flex items-center justify-center gap-2 py-4 rounded-[20px] bg-papaya-whip/50 text-bronze-dark border border-papaya text-xs font-bold hover:bg-white transition-all shadow-sm"
        >
          🐛 Reportar error
        </a>
        <form action={logoutAction}>
          <button 
            type="submit" 
            className="w-full flex items-center justify-center gap-2 py-4 rounded-[20px] bg-white/60 text-rose-500 border border-rose-100 text-xs font-bold hover:bg-rose-500 hover:text-white transition-all shadow-sm"
          >
            🛑 Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
