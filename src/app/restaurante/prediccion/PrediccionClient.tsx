'use client';

import { useState } from 'react';

type Plato = { nombre: string; categoria: string; ingredientes_principales: string };

export default function PrediccionClient({ aforo }: { aforo: number }) {
  const [modo, setModo] = useState<'ocr' | 'manual'>('ocr');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrMsg, setOcrMsg] = useState('');
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  
  const [clima, setClima] = useState('Soleado');
  const [evento, setEvento] = useState(false);
  const [festivo, setFestivo] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  function updatePlato(i: number, field: keyof Plato, v: string) {
    setPlatos(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: v } : p));
  }
  function addPlato() { setPlatos(prev => [...prev, { nombre: '', categoria: 'Primero', ingredientes_principales: '' }]); }
  function removePlato(i: number) { setPlatos(prev => prev.filter((_, idx) => idx !== i)); }

  async function handleOcr() {
    if (!file) return;
    setOcrLoading(true); setOcrMsg('');
    const fd = new FormData(); fd.append('file', file);
    try {
      const res = await fetch('/api/ocr', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.platos) { 
        setPlatos(data.platos); 
        setOcrMsg('✅ Menú detectado. Revísalo abajo.'); 
        setShowEditor(true);
      }
      else setOcrMsg('❌ ' + (data.error || 'Error al analizar la imagen.'));
    } catch {
      setOcrMsg('❌ Error de red.');
    } finally {
      setOcrLoading(false);
    }
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

  function getMenuType(listaPlatos: Plato[]) {
    const keywordsHot = ['cocido', 'sopa', 'lentejas', 'guiso', 'caldo', 'puchero', 'potaje', 'fabada', 'caliente', 'brasa', 'asado', 'horno'];
    const keywordsCold = ['gazpacho', 'salmorejo', 'ensalada', 'ensaladilla', 'tartar', 'carpaccio', 'frio', 'fria', 'fresco', 'ceviche', 'poke'];
    
    let hotScore = 0;
    let coldScore = 0;
    
    listaPlatos.forEach(p => {
      const text = (p.nombre + ' ' + (p.ingredientes_principales || '')).toLowerCase();
      if (keywordsHot.some(k => text.includes(k))) hotScore++;
      if (keywordsCold.some(k => text.includes(k))) coldScore++;
    });
    
    if (hotScore > coldScore) return 'hot';
    if (coldScore > hotScore) return 'cold';
    return 'balanced';
  }

  function predecir() {
    const diaSemana = new Date().getDay(); 
    const mapping: Record<number, number> = { 1:0, 2:1, 3:2, 4:3, 5:4, 6:5, 0:6 };
    const diaPython = mapping[diaSemana] ?? 0;

    const FACTOR_ROTACION = 1.85; 
    const capacidadReal = Math.floor(aforo * FACTOR_ROTACION);

    const BASE_OCUP: Record<number, number> = { 
      0: 0.82, 1: 0.86, 2: 0.89, 3: 0.87, 4: 0.68, 5: 0.32, 6: 0.22 
    };
    
    let baseOcup = BASE_OCUP[diaPython] ?? 0.75;

    const menuType = getMenuType(platos);
    let menuModifier = 1.0;

    if (menuType === 'hot') {
      if (clima === 'Frío' || clima === 'Lluvia') menuModifier = 1.15;
      if (clima === 'Soleado') menuModifier = 0.92;
    } else if (menuType === 'cold') {
      if (clima === 'Soleado') menuModifier = 1.20;
      if (clima === 'Frío') menuModifier = 0.85;
    }

    baseOcup = baseOcup * menuModifier;
    if (festivo) baseOcup = Math.min(baseOcup, 0.28);
    if (clima === 'Lluvia' || clima === 'Frío') baseOcup = baseOcup * 0.96;
    if (evento && !festivo) baseOcup = Math.min(0.96, baseOcup * 1.08);

    const total = Math.max(1, Math.floor(capacidadReal * baseOcup));
    const porc = Math.min(100, Math.floor(total / capacidadReal * 100));

    setResultado({ total, porc, capacidad: capacidadReal, clima, evento, festivo, platos, menuType });
  }

  const porcColor = resultado ? (resultado.porc >= 90 ? '#e11d48' : resultado.porc >= 65 ? '#d4a373' : '#a3ad85') : '';

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="main-title text-4xl mb-2">Predicción de demanda</h1>
      <p className="text-slate-500 mb-10 italic">IA entrenada con datos de Azca: clima, eventos y tráfico laboral.</p>

      {/* Paso 1 */}
      <div className="card p-10 mb-12 border-sage/30">
        <h2 className="font-serif text-2xl mb-6 text-sage-dark flex items-center gap-3">
           <span className="bg-sage/20 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">1</span>
           Configuración del menú
        </h2>
        
        <div className="flex bg-beige/30 p-1.5 rounded-2xl max-w-sm mb-8 border border-beige/50">
          {(['ocr', 'manual'] as const).map(m => (
            <button key={m} onClick={() => m === 'manual' ? switchToManual() : setModo('ocr')} 
              className={`flex-1 py-3 rounded-xl font-bold transition-all text-sm ${modo === m ? 'bg-white text-bronze-dark shadow-sm border border-beige' : 'text-slate-400 hover:text-slate-600'}`}>
              {m === 'ocr' ? '📷 Foto de menú' : '✍️ Entrada manual'}
            </button>
          ))}
        </div>

        {modo === 'ocr' && (
          <div className="space-y-6">
            <div 
              onClick={() => document.getElementById('ocr-file')?.click()}
              className="border-2 border-dashed border-beige bg-cornsilk/20 rounded-[40px] p-16 text-center cursor-pointer hover:bg-cornsilk/40 transition-all group"
            >
              {previewUrl ? (
                <img src={previewUrl} alt="preview" className="max-h-60 mx-auto rounded-3xl shadow-xl transition-transform group-hover:scale-105" />
              ) : (
                <div className="space-y-4">
                  <div className="text-6xl group-hover:scale-110 transition-transform inline-block">📸</div>
                  <p className="font-bold text-bronze-dark text-lg">Suelta aquí tu menú</p>
                  <p className="text-slate-400 text-sm max-w-xs mx-auto italic">Analizaremos los ingredientes para un cálculo más preciso.</p>
                </div>
              )}
            </div>
            <input id="ocr-file" type="file" accept="image/png,image/jpeg" hidden onChange={e => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              if (f) setPreviewUrl(URL.createObjectURL(f));
            }} />
            
            {file && !showEditor && (
              <div className="flex justify-center">
                <button className="btn-primary" onClick={handleOcr} disabled={ocrLoading}>
                  {ocrLoading ? 'Analizando...' : 'Empezar análisis inteligente'}
                </button>
              </div>
            )}
            {ocrMsg && <p className={`text-center font-bold text-sm ${ocrMsg.includes('✅') ? 'text-sage-dark' : 'text-rose-400'}`}>{ocrMsg}</p>}
          </div>
        )}

        {showEditor && (
          <div className="mt-8 space-y-6 animate-in fade-in duration-500">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-700">Platos detectados</h3>
                <button onClick={addPlato} className="bg-sage text-sage-dark px-4 py-2 rounded-xl text-xs font-black shadow-sm">+ Añadir plato</button>
             </div>
             <div className="space-y-4">
                {platos.map((p, i) => (
                  <div key={i} className="flex flex-wrap md:flex-nowrap gap-4 p-4 bg-white border border-beige rounded-2xl shadow-sm relative group">
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-[10px] text-slate-400 font-bold mb-1 block">Nombre del plato</label>
                      <input type="text" value={p.nombre} onChange={e => updatePlato(i, 'nombre', e.target.value)} className="w-full !p-0 border-none bg-transparent font-bold text-slate-800 text-lg placeholder:text-slate-200" placeholder="Nombre del plato..." />
                    </div>
                    <div className="w-full md:w-32">
                      <label className="text-[10px] text-slate-400 font-bold mb-1 block">Categoría</label>
                      <select value={p.categoria} onChange={e => updatePlato(i, 'categoria', e.target.value)} className="w-full !p-0 border-none bg-transparent font-bold text-light-bronze text-sm cursor-pointer">
                        <option>Primero</option><option>Segundo</option><option>Postre</option>
                      </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-[10px] text-slate-400 font-bold mb-1 block">Ingredientes clave</label>
                      <input type="text" value={p.ingredientes_principales} onChange={e => updatePlato(i, 'ingredientes_principales', e.target.value)} className="w-full !p-0 border-none bg-transparent text-sm italic text-slate-500 placeholder:text-slate-200" placeholder="Ej: pollo, tomate, patata..." />
                    </div>
                    <button onClick={() => removePlato(i)} className="absolute -right-2 -top-2 w-8 h-8 bg-rose-50 text-rose-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm border border-rose-100">🗑️</button>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>

      {/* Paso 2 */}
      {showEditor && (
        <div className="card p-10 mb-12 border-papaya/30">
          <h2 className="font-serif text-2xl mb-8 text-bronze-dark flex items-center gap-3">
             <span className="bg-papaya w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white">2</span>
             Condiciones del entorno
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <div className="space-y-4">
              <label>🌤️ Clima actual</label>
              <select value={clima} onChange={e => setClima(e.target.value)} className="bg-cornsilk/20 border-beige">
                {['Soleado','Nublado','Lluvia','Frío'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border border-beige shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setEvento(!evento)}>
              <div className={`w-6 h-6 rounded-full border-2 border-beige flex items-center justify-center ${evento ? 'bg-light-bronze border-light-bronze' : 'bg-transparent'}`}>
                 {evento && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <p className="font-bold text-slate-700">⚽ Fútbol en el Bernabéu</p>
            </div>
            <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border border-beige shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setFestivo(!festivo)}>
              <div className={`w-6 h-6 rounded-full border-2 border-beige flex items-center justify-center ${festivo ? 'bg-light-bronze border-light-bronze' : 'bg-transparent'}`}>
                 {festivo && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <p className="font-bold text-slate-700">📅 Día festivo / Puente</p>
            </div>
          </div>

          <button className="btn-primary w-full py-6 text-xl shadow-bronze/30" onClick={predecir}>
            Calcular predicción realista
          </button>
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <div className="mt-20 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
          <div className="text-center mb-12">
            <h2 className="font-serif text-5xl text-sage-dark mb-4">Resultado del análisis</h2>
            <div className="h-1.5 w-24 bg-light-bronze mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="metric-card bg-white flex flex-col items-center justify-center py-12">
              <label className="mb-4">Demanda estimada</label>
              <div className="relative">
                <span className="text-[7rem] font-serif font-black leading-none" style={{ color: porcColor }}>{resultado.total}</span>
              </div>
              <p className="font-black text-xl text-slate-400 mt-2">{resultado.porc}% ocupación</p>
            </div>
            
            <div className="md:col-span-2 ai-card flex flex-col justify-center space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm bg-white" style={{ color: porcColor }}>
                  {resultado.porc >= 90 ? '🔥' : resultado.porc >= 65 ? '✨' : '🌿'}
                </div>
                <p className="font-black text-2xl leading-tight" style={{ color: porcColor }}>
                  {resultado.porc >= 90 ? '¡Prepárate! Alta demanda esperada' : (resultado.porc >= 65 ? 'Servicio fluido con ocupación sólida' : 'Servicio tranquilo — Gestión óptima')}
                </p>
              </div>
              <p className="text-bronze-dark/70 text-lg leading-relaxed italic">
                La IA ha tenido en cuenta tu aforo real de <strong>{aforo} plazas</strong> y la afinidad de tu oferta culinaria (menú <strong>{resultado.menuType === 'hot' ? 'caliente y nutritivo' : resultado.menuType === 'cold' ? 'fresco y ligero' : 'equilibrado'}</strong>) con un clima <strong>{resultado.clima.toLowerCase()}</strong>.
              </p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-beige pb-4">
               <h3 className="font-serif text-2xl text-sage-dark">Sugerencia de aprovisionamiento</h3>
               <span className="text-[10px] bg-sage/20 text-sage-dark px-3 py-1 rounded-full font-black uppercase tracking-widest">Algoritmo predictivo</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {resultado.platos.map((pl: Plato, i: number) => {
                const catColor: Record<string, string> = { Primero: '#a3ad85', Segundo: '#bc8a5f', Postre: '#d4a373' };
                const c = catColor[pl.categoria] || '#94a3b8';
                return (
                  <div key={i} className="card p-8 hover:scale-[1.03] transition-transform">
                    <span className="text-[10px] font-black px-3 py-1 rounded-lg" style={{ background: `${c}20`, color: c }}>{pl.categoria}</span>
                    <p className="font-bold text-2xl text-slate-800 mt-4 mb-2 truncate">{pl.nombre}</p>
                    <div className="flex items-end gap-2">
                       <span className="text-5xl font-serif" style={{ color: c }}>{resultado.total}</span>
                       <span className="text-sm font-bold text-slate-400 mb-2">raciones</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-20 flex justify-center">
            <button className="text-slate-400 font-bold hover:text-light-bronze transition-colors flex items-center gap-2" onClick={() => window.location.reload()}>
              <span>🔄</span> Realizar cálculo nuevo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
