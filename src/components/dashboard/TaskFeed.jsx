import GameCard from '../GameCard';

export default function TaskFeed({ user, queue, onAnswer }) {
  return (
    <div>
       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
         <h3 className="tech-font" style={{ margin: 0, fontSize: '1.2rem', color: 'var(--primary)' }}>/// TÂCHES RAPIDES</h3>
         <div style={{ display: 'flex', gap: '5px' }}>
            {[...Array(3)].map((_, i) => (
                <div key={i} style={{ width: '8px', height: '8px', background: i === 0 ? 'var(--success)' : '#334155', borderRadius: '50%' }}></div>
            ))}
         </div>
       </div>

       {queue.length > 0 ? (
         <GameCard user={user} question={queue[0]} onAnswer={onAnswer} />
       ) : (
         <div className="pro-card text-center" style={{ padding: '4rem 2rem', border: '1px dashed #334155' }}>
           <h2 className="text-muted mb-4" style={{ opacity: 0.5 }}>AUCUNE TÂCHE</h2>
           <button className="btn-secondary" onClick={() => window.location.reload()}>RECHERCHER DE NOUVELLES TÂCHES</button>
         </div>
       )}
    </div>
  );
}