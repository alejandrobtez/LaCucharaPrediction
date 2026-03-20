import { getSession } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import { queryDb } from '@/lib/db';
import Sidebar from '@/components/Sidebar';

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'oficinista') redirect('/');

  const perfil = await queryDb<any>('SELECT imagen_perfil, sobre_mi FROM Usuario WHERE id = @id', { id: session.id });
  const imgSrc = perfil[0]?.imagen_perfil || '';
  const sobreMi = perfil[0]?.sobre_mi || '';

  const navItems = [
    { label: 'Inicio', href: '/cliente', icon: '🏠' },
    { label: 'Menús disponibles', href: '/cliente/menus', icon: '🍽️' },
    { label: 'Mis favoritos', href: '/cliente/favoritos', icon: '❤️' },
    { label: 'Mi perfil', href: '/cliente/perfil', icon: '👤' },
  ];

  return (
    <div className="flex bg-[#fefcf5] min-h-screen">
      <Sidebar userName={session.name} avatarSrc={imgSrc} subtitle={sobreMi ? sobreMi.slice(0, 40) : 'Comensal'} navItems={navItems} />
      <main className="main-content flex-1 max-w-[1400px]">{children}</main>
    </div>
  );
}
