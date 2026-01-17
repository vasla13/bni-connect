export default function WalletCard({ balance, status, onWithdraw }) {
  const isWaiting = status === 'waiting';

  return (
    <div className="pro-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <h3 className="text-cyan">PORTEFEUILLE TEMPORAIRE</h3>
      <div style={{ fontSize: '3.5rem', fontFamily: 'Rajdhani', fontWeight: 'bold', color: isWaiting ? 'var(--warning)' : 'white' }}>
        {isWaiting ? 0 : balance} $
      </div>

      {isWaiting ? (
        <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', padding: '15px', borderRadius: '8px', border: '1px solid var(--warning)' }}>
          ⏳ TRAITEMENT EN COURS...
        </div>
      ) : (
        <button 
          onClick={onWithdraw} 
          disabled={balance < 2000} 
          className="btn-main" 
          style={{ marginTop: '20px' }}
        >
          {balance < 2000 ? 'MINIMUM 2000$ REQUIS' : 'RÉCUPÉRER MON ARGENT'}
        </button>
      )}
    </div>
  );
}