import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function GameCard({ user, question, onAnswer }) {
  const [exitX, setExitX] = useState(0);
  const [freeText, setFreeText] = useState("");

  const today = new Date().toLocaleDateString('fr-FR');
  const currentCount = (user.game && user.game.lastQuestionDate === today) ? user.game.dailyCount : 0;

  const handleSubmit = (value) => {
    // Animation de sortie
    const direction = Math.random() > 0.5 ? 200 : -200;
    setExitX(direction);
    setTimeout(() => {
        onAnswer(value, question);
        setExitX(0);
        setFreeText(""); 
    }, 200);
  };

  // Fonction pour rendre le tag "joli" ou le masquer
  const formatTag = (tag) => {
    if (!tag || tag === "SANS TAG" || tag.includes("RH_DISPO")) return "MISSION STANDARD";
    return `MISSION : ${tag}`;
  };

  const cardVariants = {
    initial: { scale: 0.98, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { x: exitX, opacity: 0, transition: { duration: 0.2 } }
  };

  return (
    <div style={{ position: 'relative', height: '400px' }}>
      <AnimatePresence mode='wait'>
        <motion.div
          key={question.uniqueId || question.id} 
          variants={cardVariants}
          initial="initial" animate="animate" exit="exit"
          className="pro-card"
          style={{ 
            position: 'absolute', inset: 0, zIndex: 10,
            display: 'flex', flexDirection: 'column',
            borderTop: '4px solid var(--primary)',
            background: 'linear-gradient(180deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.9) 100%)'
          }}
        >
          {/* HEADER CARTE */}
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span className="tech-font" style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>
                    {formatTag(question.tag)}
                </span>
                <span style={{ 
                    background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', 
                    padding: '2px 8px', borderRadius: '2px', fontSize: '0.8rem', fontWeight: 'bold' 
                }}>
                    +{question.reward || 50} $
                </span>
            </div>
            <h2 style={{ fontSize: '1.2rem', lineHeight: '1.5', fontWeight: '500', color: '#e2e8f0', minHeight: '3.6rem' }}>
                {question.text}
            </h2>
          </div>

          {/* CONTENU / RÉPONSES */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
            {question.type === 'qcm' ? (
                question.options.map((opt, i) => (
                  <button 
                    key={i} 
                    className="btn-secondary" 
                    onClick={() => handleSubmit(opt)}
                    style={{ textAlign: 'left', justifyContent: 'flex-start', padding: '12px 16px' }}
                  >
                    <span style={{ color: 'var(--primary)', marginRight: '10px' }}>{i + 1}.</span> {opt}
                  </button>
                ))
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <textarea 
                  rows="3"
                  placeholder="Saisissez votre rapport..."
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  style={{ resize: 'none' }}
                />
                <button className="btn-main" onClick={() => handleSubmit(freeText)} disabled={!freeText.trim()}>
                    SOUMETTRE
                </button>
              </div>
            )}
          </div>

          {/* FOOTER : PROGRESSION */}
          <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginBottom: '4px' }}>
                <span>QUOTA JOURNALIER</span>
                <span>{currentCount} / 5</span>
             </div>
             <div className="progress">
                <span style={{ width: `${(currentCount / 5) * 100}%` }}></span>
             </div>
          </div>

        </motion.div>
      </AnimatePresence>
      
      {/* Effet d'arrière plan pour donner de la profondeur */}
      <div style={{ 
          position: 'absolute', top: '8px', left: '8px', right: '8px', bottom: '-8px', 
          background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius)', zIndex: 0 
      }} />
    </div>
  );
}