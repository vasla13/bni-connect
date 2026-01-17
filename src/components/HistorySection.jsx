import { History, TrendingUp, TrendingDown } from 'lucide-react';

export default function HistorySection({ history }) {
  return (
    <div className="pro-card" style={{ marginTop: '2rem' }}>
      <h3 className="text-cyan" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <History /> HISTORIQUE RÉCENT
      </h3>
      
      {history.length === 0 ? (
          <p className="text-muted" style={{ fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>
            Aucune transaction récente. Commencez à jouer !
          </p>
      ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {history.map(item => (
                  <div key={item.id} style={{ 
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px',
                      borderLeft: item.type === 'gain' ? '4px solid var(--success)' : '4px solid var(--warning)'
                  }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <div style={{ 
                              background: item.type === 'gain' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', 
                              padding: '8px', borderRadius: '50%', display: 'flex' 
                          }}>
                              {item.type === 'gain' ? <TrendingUp size={20} color="var(--success)"/> : <TrendingDown size={20} color="var(--warning)"/>}
                          </div>
                          <div>
                              <div style={{ fontWeight: 'bold' }}>{item.label}</div>
                              <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                                {new Date(item.date).toLocaleDateString()} à {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </div>
                          </div>
                      </div>
                      <span style={{ 
                          fontWeight: 'bold', fontSize: '1.2rem', fontFamily: 'Rajdhani',
                          color: item.type === 'gain' ? 'var(--success)' : 'var(--warning)',
                      }}>
                          {item.montant > 0 ? '+' : ''}{item.montant} $
                      </span>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
}