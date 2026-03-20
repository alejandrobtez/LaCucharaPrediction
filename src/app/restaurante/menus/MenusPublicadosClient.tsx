'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Plato = { nombre: string; categoria: string; ingredientes_principales: string };
type Menu = { id: number; precio: number; fecha: string; platos: Plato[] };

export default function MenusPublicadosClient({ menus }: { menus: Menu[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPlatos, setEditPlatos] = useState<Plato[]>([]);
  const [editPrecio, setEditPrecio] = useState(12.0);
  const [msg, setMsg] = useState('');
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  function startEdit(m: Menu) {
    setEditingId(m.id);
    setEditPlatos(m.platos.map(p => ({ ...p })));
    setEditPrecio(m.precio);
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este menú?')) return;
    const res = await fetch('/api/menus/eliminar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    if (res.ok) { setMsg('✅ Menú eliminado.'); router.refresh(); }
    else setMsg('❌ Error al eliminar.');
  }

  async function handleSaveEdit() {
    const res = await fetch('/api/menus/editar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingId, precio: editPrecio, platos: editPlatos })
    });
    if (res.ok) { setMsg('✅ Menú actualizado.'); setEditingId(null); router.refresh(); }
    else setMsg('❌ Error al guardar.');
  }

  function updatePlato(i: number, field: keyof Plato, value: string) {
    setEditPlatos(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  }

  if (menus.length === 0) {
    return (
      <div>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2.5rem', marginBottom: '0.5rem' }}>Menús Publicados</h1>
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '16px', padding: '2rem', textAlign: 'center', color: '#0284c7' }}>
          Aún no has publicado ningún menú. Ve a "Publicar Menú" para empezar.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2.5rem', marginBottom: '0.5rem' }}>Menús Publicados</h1>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>Todos los menús que has publicado. Puedes editarlos o eliminarlos.</p>

      {msg && <div style={{ padding: '0.75rem', borderRadius: '10px', marginBottom: '1rem',
        background: msg.startsWith('✅') ? '#f0fdf4' : '#fff1f2',
        color: msg.startsWith('✅') ? '#16a34a' : '#e11d48',
        border: `1px solid ${msg.startsWith('✅') ? '#bbf7d0' : '#fecdd3'}`, fontSize: '0.875rem' }}>{msg}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {menus.map(m => (
          <div key={m.id} className="metric-card" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                 onClick={() => setExpanded(p => ({ ...p, [m.id]: !p[m.id] }))}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                  🍽️ Menú del {new Date(m.fecha).toLocaleDateString('es-ES')}
                </span>
                <span style={{ background: '#e0f2fe', color: '#0284c7', borderRadius: '8px', padding: '2px 10px', fontWeight: 600, fontSize: '0.85rem', marginLeft: '0.75rem' }}>
                  {parseFloat(m.precio as any).toFixed(2)}€
                </span>
              </div>
              <span style={{ color: '#94a3b8' }}>{expanded[m.id] ? '▲' : '▼'}</span>
            </div>

            {expanded[m.id] && (
              <div style={{ marginTop: '1rem' }}>
                {editingId === m.id ? (
                  <div>
                    <div style={{ maxWidth: 200, marginBottom: '1rem' }}>
                      <label>Precio (€)</label>
                      <input type="number" step="0.5" value={editPrecio} onChange={e => setEditPrecio(parseFloat(e.target.value))} />
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          {['Nombre', 'Categoría', 'Ingredientes'].map(h => (
                            <th key={h} style={{ padding: '0.5rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {editPlatos.map((p, i) => (
                          <tr key={i}>
                            <td style={{ padding: '0.4rem' }}><input type="text" value={p.nombre} onChange={e => updatePlato(i, 'nombre', e.target.value)} style={{ padding: '0.3rem 0.5rem', fontSize: '0.875rem' }} /></td>
                            <td style={{ padding: '0.4rem' }}>
                              <select value={p.categoria} onChange={e => updatePlato(i, 'categoria', e.target.value)} style={{ padding: '0.3rem 0.5rem', fontSize: '0.875rem' }}>
                                <option>Primero</option><option>Segundo</option><option>Postre</option>
                              </select>
                            </td>
                            <td style={{ padding: '0.4rem' }}><input type="text" value={p.ingredientes_principales} onChange={e => updatePlato(i, 'ingredientes_principales', e.target.value)} style={{ padding: '0.3rem 0.5rem', fontSize: '0.875rem' }} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-primary" onClick={handleSaveEdit}>💾 Guardar cambios</button>
                      <button className="btn-secondary" onClick={() => setEditingId(null)}>❌ Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {['Primero', 'Segundo', 'Postre'].map(cat => {
                      const items = m.platos.filter(p => p.categoria === cat).map(p => p.nombre);
                      return items.length > 0 ? (
                        <p key={cat} style={{ margin: '0.3rem 0', fontSize: '0.9rem' }}>
                          <strong>{cat}:</strong> {items.join(', ')}
                        </p>
                      ) : null;
                    })}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                      <button className="btn-secondary" onClick={() => startEdit(m)}>✏️ Editar este menú</button>
                      <button className="btn-danger" onClick={() => handleDelete(m.id)}>🗑️ Eliminar</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
