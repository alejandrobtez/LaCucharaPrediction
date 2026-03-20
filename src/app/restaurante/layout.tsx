import { getSession } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import { queryDb } from '@/lib/db';
import Sidebar from '@/components/Sidebar';

export default async function RestauranteLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== 'restaurante') redirect('/');

  // Obtener imagen de perfil
  const perfil = await queryDb<any>('SELECT imagen_perfil, descripcion FROM Restaurante WHERE id = @id', { id: session.id });
  const imgSrc = perfil[0]?.imagen_perfil || '';
  const desc = perfil[0]?.descripcion || '';

  const navItems = [
    { label: 'Inicio', href: '/restaurante', icon: '🏠' },
    { label: 'Publicar menú', href: '/restaurante/publicar', icon: '📝' },
    { label: 'Menús publicados', href: '/restaurante/menus', icon: '🍽️' },
    { label: 'Predicción de demanda', href: '/restaurante/prediccion', icon: '📊' },
    { label: 'Mi perfil', href: '/restaurante/perfil', icon: '🏪' },
  ];

  return (
    <div className="flex bg-[#fefcf5] min-h-screen">
      <Sidebar
        userName={session.name}
        avatarSrc={imgSrc}
        subtitle={desc ? desc.slice(0, 40) + '...' : 'Establecimiento'}
        navItems={navItems}
      />
      <main className="main-content flex-1 max-w-[1400px]">
        {children}
      </main>
    </div>
  );
}
