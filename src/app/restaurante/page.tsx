import { getSession } from '@/app/actions/auth';
import { queryDb } from '@/lib/db';

function aiForecast(mes: number, aforo: number) {
  const FACTOR = 1.8;
  let base = 0.65;
  if ([3,4,5,9,10,11].includes(mes)) base += 0.08;
  else if ([12,1,2].includes(mes)) base += 0.05;
  return {
    menus: Math.floor(aforo * FACTOR * base),
    porc: Math.floor(base * 100),
    nivel: base < 0.75 ? '🟢 Normal' : base < 0.90 ? '🟡 Alta' : '🔴 Lleno'
  };
}

const climateMadrid: Record<number, [string, string, string]> = {
  1: ["enero","frío intenso (2–9°C)","cocidos madrileños, lentejas, potaje y sopas reconfortantes"],
  2: ["febrero","frío (4–11°C)","guisos consistentes, carne estofada y cremas de verduras"],
  3: ["marzo","frío-templado (7–15°C)","callos, bacalao a la vizcaína, menestras y verduras de temporada"],
  4: ["abril","templado (9–17°C), lluvioso","platos ligeros con alcachofas, espárragos y cordero"],
  5: ["mayo","templado-cálido (13–22°C)","ensaladas templadas, carnes a la plancha y embutidos ibéricos"],
  6: ["junio","cálido (17–27°C)","gazpacho, salmorejo, ensaladas y pescados a la plancha"],
  7: ["julio","caluroso (20–33°C)","platos fríos: gazpacho, ensaladilla rusa y tapas ligeras"],
  8: ["agosto","muy caluroso (20–33°C)","opciones frescas: vichyssoise, tartar, carpaccio y postres helados"],
  9: ["septiembre","cálido-templado (15–27°C)","guisos suaves: setas de temporada, carnes a la brasa y pasta"],
  10: ["octubre","templado-frío (10–20°C)","potajes, setas, caza (perdiz, conejo) y cremas de calabaza"],
  11: ["noviembre","frío (6–14°C)","callos, cocido madrileño, fabada y castañas"],
  12: ["diciembre","frío (3–10°C)","platos festivos: sopa de pescado, marisco, cordero asado y turrón"],
};

export default async function RestauranteHome() {
  const session = await getSession();
  const mes = new Date().getMonth() + 1;
  const today = new Date().toISOString().split('T')[0];
  
  const { menus, porc, nivel } = aiForecast(mes, session.aforo || 50);
  
  const [menuHoyRes, webRes] = await Promise.all([
    queryDb<any>(`SELECT COUNT(*) as c FROM MenuDiario WHERE restaurante_id = @id AND CONVERT(date,fecha) = CONVERT(date,GETDATE())`, { id: session.id }),
    queryDb<any>(`SELECT sitio_web FROM Restaurante WHERE id = @id`, { id: session.id }),
  ]);

  const tieneMenu = (menuHoyRes[0]?.c || 0) > 0;
  const sitioWeb = webRes[0]?.sitio_web || '';

  const c = climateMadrid[mes] || ["este mes","variable","menús variados"];
  const sug = Math.floor((session.aforo || 50) * 1.85 * 0.70);
  const iaText = `Estamos en ${c[0]} — clima típico en Madrid: ${c[1]}. Lo más demandado ahora son ${c[2]}. Con tu aforo y rotación de turnos, prepara alrededor de ${sug} raciones como base.`;

  return (
    <div>
      <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2.5rem', marginBottom: '0.5rem' }}>
        ¡Gestionemos {session.name}!
      </h1>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>Un vistazo rápido a cómo va tu restaurante hoy.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Previsión aforo */}
        <div className="metric-card">
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>📊 Previsión de aforo hoy</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span style={{ fontSize: '3rem', fontWeight: 700, color: '#0284c7', fontFamily: "'DM Serif Display', serif" }}>{menus}</span>
            <span style={{ color: '#94a3b8' }}>menús</span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.5rem' }}>Ocupación estimada: <strong>{porc}%</strong> · {nivel}</p>
          <p style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Local de <strong>{session.aforo} plazas</strong> → hasta <strong>{Math.floor((session.aforo||50)*1.8)}</strong> menús con rotación</p>
        </div>

        {/* Menú publicado hoy */}
        <div className="metric-card">
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.75rem' }}>🍽️ ¿Menú publicado hoy?</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '2.5rem' }}>{tieneMenu ? '✅' : '❌'}</span>
            <div>
              <p style={{ fontWeight: 700, fontSize: '1.1rem', color: tieneMenu ? '#16a34a' : '#e11d48', margin: 0 }}>
                {tieneMenu ? 'Sí, publicado' : 'No publicado'}
              </p>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>{today}</p>
            </div>
          </div>
        </div>

        {/* Sitio web */}
        <div className="metric-card">
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.75rem' }}>🌐 Sitio web</p>
          {sitioWeb ? (
            <a href={sitioWeb.startsWith('http') ? sitioWeb : `https://${sitioWeb}`} target="_blank"
               style={{ color: '#0284c7', fontWeight: 600, wordBreak: 'break-all', fontSize: '0.95rem' }}>
              {sitioWeb}
            </a>
          ) : (
            <>
              <p style={{ color: '#94a3b8', margin: 0 }}>No configurado aún.</p>
              <p style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>Añádelo en tu perfil.</p>
            </>
          )}
        </div>
      </div>

      {/* IA Recommendation */}
      <div className="ai-card">
        <p style={{ fontWeight: 700, color: '#0284c7', marginBottom: '0.5rem', fontSize: '0.95rem' }}>🤖 Asistente Gastronómico IA</p>
        <p style={{ color: '#0f172a', lineHeight: 1.7, margin: 0 }}>{iaText}</p>
      </div>
    </div>
  );
}
