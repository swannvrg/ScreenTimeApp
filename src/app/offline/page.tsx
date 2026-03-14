export default function OfflinePage() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d0d1a 0%, #0a1628 50%, #0d0d1a 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Outfit', sans-serif", padding: '32px',
    }}>
      <p style={{ fontSize: 48, marginBottom: 16 }}>📡</p>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0f0ff', margin: '0 0 8px' }}>Pas de connexion</h1>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center', maxWidth: 280 }}>
        Reconnecte-toi à internet pour logger tes tâches.
      </p>
    </main>
  )
}