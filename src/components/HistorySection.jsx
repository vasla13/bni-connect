import { History, TrendingUp, TrendingDown } from 'lucide-react';

export default function HistorySection({ history }) {
  return (
    <div className="pro-card mt-4">
      <h3 className="text-cyan mb-4" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <History /> HISTORIQUE RÉCENT
      </h3>
      
      {history.length === 0 ? (
          <p className="text-muted text-center" style={{ fontStyle: 'italic', padding: '20px' }}>
            Aucune transaction récente. Commencez à jouer !
          </p>
      ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {history.map(item => {
                  const isGain = item.type === 'gain';
                  const colorVar = isGain ? 'var(--success)' : 'var(--warning)';
                  const bgVar = isGain ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)';

                  return (
                    <div key={item.id} className="history-item" style={{ borderColor: colorVar }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div className="icon-bubble" style={{ background: bgVar }}>
                                {isGain ? <TrendingUp size={20} color={colorVar}/> : <TrendingDown size={20} color={colorVar}/>}
                            </div>
                            <div>
                                <div style={{ fontWeight: 'bold' }}>{item.label}</div>
                                <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                                    {new Date(item.date).toLocaleDateString()} à {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                            </div>
                        </div>
                        <span className="tech-font" style={{ fontWeight: 'bold', fontSize: '1.2rem', color: colorVar }}>
                            {item.montant > 0 ? '+' : ''}{item.montant} $
                        </span>
                    </div>
                  );
              })}
          </div>
      )}
    </div>
  );
}