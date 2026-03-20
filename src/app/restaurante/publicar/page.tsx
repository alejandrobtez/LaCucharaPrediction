'use client';

import { useState, useRef } from 'react';

const ETIQUETAS = ["Vegano","Vegetariano","Sin Gluten","Sin Lácteos","Carne","Pescado","Mediterráneo","Asiático","Picante","Sin Mariscos"];

type Plato = { nombre: string; categoria: string; ingredientes_principales: string };

export default function PublicarMenuPage() {
  const [modo, setModo] = useState<'ocr' | 'manual'>('ocr');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrMsg, setOcrMsg] = useState('');
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [precio, setPrecio] = useState(12.0);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [tags, setTags] = useState<string[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [pubMsg, setPubMsg] = useState('');
  const [pubLoading, setPubLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File | null) {
    setFile(f);
    if (f) setPreviewUrl(URL.createObjectURL(f));
    else setPreviewUrl('');
  }

  async function handleOcr() {
    if (!file) return;
    setOcrLoading(true);
    setOcrMsg('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/ocr', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.platos) {
        setPlatos(data.platos);
        if (data.precio) setPrecio(data.precio);
        setOcrMsg('✅ Menú detectado. Revísalo abajo.');
        setShowEditor(true);
      } else {
        setOcrMsg('❌ ' + (data.error || 'No se pudo analizar la imagen.'));
      }
    } catch { setOcrMsg('❌ Error de red.'); } finally { setOcrLoading(false); }
  }

  function switchToManual() {
    setModo('manual');
    if (platos.length === 0) {
      setPlatos([
        { nombre: '', categoria: 'Primero', ingredientes_principales: '' },
        { nombre: '', categoria: 'Segundo', ingredientes_principales: '' },
        { nombre: '', categoria: 'Postre', ingredientes_principales: '' },
      ]);
    }
    setShowEditor(true);
  }

  function updatePlato(i: number, field: keyof Plato, value: string) {
    setPlatos(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  }
  function addPlato() { setPlatos(prev => [...prev, { nombre: '', categoria: 'Primero', ingredientes_principales: '' }]); }
  function removePlato(i: number) { setPlatos(prev => prev.filter((_, idx) => idx !== i)); }
  function toggleTag(t: string) { setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]); }

  async function handlePublish() {
    setPubLoading(true);
    setPubMsg('');
    try {
      const res = await fetch('/api/menus/publicar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ precio, fecha, platos, etiquetas: tags.join(', ') })
      });
      const data = await res.json();
      if (res.ok) {
        setPubMsg('✅ Menú publicado correctamente. Ya aparece en la app de clientes.');
        setPlatos([
          { nombre: 'Ensalada mixta', categoria: 'Primero', ingredientes_principales: '' },
          { nombre: 'Filete de ternera', categoria: 'Segundo', ingredientes_principales: '' },
          { nombre: 'Tarta de queso', categoria: 'Postre', ingredientes_principales: '' },
        ]);
        setTags([]);
        setPrecio(12.0);
      } else {
        setPubMsg('❌ ' + (data.error || 'Error al publicar.'));
      }
    } catch { setPubMsg('❌ Error de red.'); } finally { setPubLoading(false); }
  }

  return (
    <div>
      <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2.5rem', marginBottom: '0.5rem' }}>Publicar Menú de Hoy</h1>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>Crea el menú del día escribiéndolo a mano o subiendo una foto. Una vez revisado, dale a <strong>¡Publícalo!</strong></p>

      {/* Fecha */}
      <div style={{ marginBottom: '1.5rem', maxWidth: 300 }}>
        <label>🗓️ Día del menú</label>
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
      </div>

      {/* Modo toggle */}
      <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '14px', padding: '4px', maxWidth: 400, marginBottom: '1.5rem' }}>
        {(['ocr', 'manual'] as const).map(m => (
          <button key={m} onClick={() => m === 'manual' ? switchToManual() : setModo('ocr')} style={{
            flex: 1, padding: '0.65rem', borderRadius: '10px',
            border: 'none',
            background: modo === m ? '#0ea5e9' : 'transparent',
            color: modo === m ? '#fff' : '#64748b',
            fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
            transition: 'all 0.2s'
          }}>
            {m === 'ocr' ? '📷 Subir foto (OCR)' : '✍️ Escribirlo a mano'}
          </button>
        ))}
      </div>

      {/* OCR Upload Zone */}
      {modo === 'ocr' && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: '2px dashed #bae6fd', borderRadius: '20px', padding: '3rem',
              textAlign: 'center', cursor: 'pointer', background: '#f0f9ff',
              transition: 'all 0.2s'
            }}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="preview" style={{ maxHeight: 280, borderRadius: 12, maxWidth: '100%' }} />
            ) : (
              <>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📷</div>
                <p style={{ color: '#0284c7', fontWeight: 600, marginBottom: '0.25rem' }}>Haz clic para seleccionar una foto</p>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Formatos: JPG, PNG. Azure Document Intelligence leerá tu menú al instante.</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg" style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files?.[0] ?? null)} />

          {file && (
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: '0.875rem' }}>📎 {file.name}</span>
              <button className="btn-primary" onClick={handleOcr} disabled={ocrLoading}>
                {ocrLoading ? '⏳ Analizando con IA...' : '🔍 Analizar con OCR'}
              </button>
            </div>
          )}
          {ocrMsg && (
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '10px',
              background: ocrMsg.startsWith('✅') ? '#f0fdf4' : '#fff1f2',
              color: ocrMsg.startsWith('✅') ? '#16a34a' : '#e11d48',
              border: `1px solid ${ocrMsg.startsWith('✅') ? '#bbf7d0' : '#fecdd3'}`, fontSize: '0.875rem' }}>
              {ocrMsg}
            </div>
          )}
        </div>
      )}

      {/* Editor de platos (solo visible tras elegir manual o tras éxito del OCR) */}
      {showEditor && (
        <div style={{ marginBottom: '1.5rem' }}>
          <hr style={{ borderColor: '#e2e8f0', marginBottom: '1.5rem' }} />
          <h3 style={{ marginBottom: '1rem', color: '#0f172a' }}>✏️ Edita los platos</h3>

          {/* Precio */}
          <div style={{ maxWidth: 200, marginBottom: '1rem' }}>
            <label>💶 Precio del menú (€)</label>
            <input type="number" step="0.5" value={precio} onChange={e => setPrecio(parseFloat(e.target.value))} />
          </div>

          {/* Tabla de platos */}
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Nombre', 'Categoría', 'Ingredientes principales', ''].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {platos.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <input type="text" value={p.nombre} onChange={e => updatePlato(i, 'nombre', e.target.value)}
                        placeholder="Nombre del plato" style={{ borderRadius: '8px', padding: '0.4rem 0.6rem', fontSize: '0.875rem' }} />
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <select value={p.categoria} onChange={e => updatePlato(i, 'categoria', e.target.value)}
                        style={{ borderRadius: '8px', padding: '0.4rem 0.6rem', fontSize: '0.875rem' }}>
                        <option>Primero</option>
                        <option>Segundo</option>
                        <option>Postre</option>
                      </select>
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <input type="text" value={p.ingredientes_principales} onChange={e => updatePlato(i, 'ingredientes_principales', e.target.value)}
                        placeholder="Ej: lechuga, tomate..." style={{ borderRadius: '8px', padding: '0.4rem 0.6rem', fontSize: '0.875rem' }} />
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      <button onClick={() => removePlato(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e11d48', fontSize: '1.1rem' }}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #f1f5f9' }}>
              <button onClick={addPlato} className="btn-secondary" style={{ fontSize: '0.875rem' }}>+ Añadir plato</button>
            </div>
          </div>

          {/* Etiquetas */}
          <h3 style={{ marginBottom: '0.75rem', color: '#0f172a' }}>🏷️ Etiquetas del menú</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.75rem' }}>Selecciona todas las que apliquen:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {ETIQUETAS.map(t => (
              <button key={t} onClick={() => toggleTag(t)} style={{
                padding: '0.4rem 0.9rem', borderRadius: '20px', border: '1.5px solid',
                borderColor: tags.includes(t) ? '#0284c7' : '#e2e8f0',
                background: tags.includes(t) ? '#e0f2fe' : '#fff',
                color: tags.includes(t) ? '#0284c7' : '#64748b',
                fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.15s'
              }}>
                {t}
              </button>
            ))}
          </div>

          {pubMsg && (
            <div style={{ padding: '0.75rem', borderRadius: '10px', marginBottom: '1rem',
              background: pubMsg.startsWith('✅') ? '#f0fdf4' : '#fff1f2',
              color: pubMsg.startsWith('✅') ? '#16a34a' : '#e11d48',
              border: `1px solid ${pubMsg.startsWith('✅') ? '#bbf7d0' : '#fecdd3'}`, fontSize: '0.875rem' }}>
              {pubMsg}
            </div>
          )}

          <button className="btn-primary" onClick={handlePublish} disabled={pubLoading}
            style={{ padding: '0.9rem 2.5rem', fontSize: '1rem' }}>
            {pubLoading ? 'Publicando...' : '🚀 ¡Publícalo!'}
          </button>
        </div>
      )}
    </div>
  );
}
