import React from 'react'

export default function App() {
  return (
    <div style={S.page}>
      <div style={S.container}>
        <div style={S.header}>
          <div style={S.logoLabel}>Barvni kompas</div>
          <h1 style={S.title}>Osebnostni profiler</h1>
          <p style={S.subtitle}>Spoznaj svojo energijsko sliko in odkleni potencial za rast.</p>
        </div>
        <div style={S.cards}>
          <a href="/oddaj" style={{ ...S.card, ...S.cardBlue }}>
            <div style={S.cardIcon}>📋</div>
            <div style={S.cardContent}>
              <div style={S.cardTitle}>Izpolni vprašalnik</div>
              <div style={S.cardDesc}>15 sklopov vprašanj za odkrivanje tvojega osebnostnega profila. Traja okoli 10 minut.</div>
            </div>
            <div style={S.cardArrow}>→</div>
          </a>
          <a href="/admin" style={{ ...S.card, ...S.cardDark }}>
            <div style={S.cardIcon}>🔐</div>
            <div style={S.cardContent}>
              <div style={S.cardTitle}>Admin panel</div>
              <div style={S.cardDesc}>Pregled izpolnjenih vprašalnikov, generiranje AI profilov in izvoz PDF poročil.</div>
            </div>
            <div style={S.cardArrow}>→</div>
          </a>
        </div>
        <div style={S.footer}>Powered by Anthropic Claude · Barvni kompas metodologija</div>
      </div>
    </div>
  )
}

const S = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg, #0f1f35 0%, #1a3a5c 60%, #0f2a45 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Helvetica Neue', Arial, sans-serif", padding: '32px 16px' },
  container: { maxWidth: 520, width: '100%' },
  header: { textAlign: 'center', marginBottom: 40 },
  logoLabel: { fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 16 },
  title: { fontSize: 36, fontWeight: 700, color: '#fff', margin: '0 0 12px 0', letterSpacing: '-0.5px' },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: 0 },
  cards: { display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 },
  card: { display: 'flex', alignItems: 'center', gap: 20, borderRadius: 18, padding: '24px 28px', textDecoration: 'none', cursor: 'pointer' },
  cardBlue: { background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' },
  cardDark: { background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' },
  cardIcon: { fontSize: 28, width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: 14, flexShrink: 0 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: 600, color: '#fff', marginBottom: 5 },
  cardDesc: { fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 },
  cardArrow: { fontSize: 20, color: 'rgba(255,255,255,0.3)', flexShrink: 0 },
  footer: { textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: 0.5 },
}
