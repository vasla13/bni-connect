export default function GameCard({ user, question, onPickQuestion, onAnswer }) {
  // Calcul du quota visuel
  const today = new Date().toLocaleDateString('fr-FR');
  const currentCount = (user.game.lastQuestionDate === today) ? user.game.dailyCount : 0;
  
  return (
    <div className="pro-card">
      <h3 className="text-cyan">ACTIVITÉ SALARIÉE</h3>
      <p className="text-muted">Répondez aux enquêtes d'entreprise.</p>
      
      {/* Barre de progression simple */}
      <div style={{ margin: '1rem 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>QUOTA : {currentCount} / 5</span>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', height: '8px', borderRadius: '4px' }}>
            <div style={{ width: `${(currentCount / 5) * 100}%`, background: 'var(--primary)', height: '100%', borderRadius: '4px', transition: 'width 0.3s' }} />
        </div>
      </div>

      {!question ? (
        <button className="btn-main" onClick={onPickQuestion}>LANCER TÂCHE (+50$)</button>
      ) : (
        <div style={{ animation: 'fadeIn 0.3s' }}>
          <p style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderLeft: '3px solid var(--primary)', marginBottom: '15px' }}>
            {question.text}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {question.options.map((opt, i) => (
              <button key={i} className="btn-secondary" onClick={() => onAnswer(opt)}>{opt}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}