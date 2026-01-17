// src/components/GameCard.jsx
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function GameCard({ user, question, onAnswer }) {
  const [exitX, setExitX] = useState(0);
  const [freeText, setFreeText] = useState("");

  // Calcul du quota visuel
  const today = new Date().toLocaleDateString('fr-FR');
  const currentCount = (user.game && user.game.lastQuestionDate === today) ? user.game.dailyCount : 0;

  // Gestion de la soumission (QCM ou Libre)
  const handleSubmit = (value) => {
    // 1. Animation de sortie (Swipe)
    const direction = Math.random() > 0.5 ? 200 : -200;
    setExitX(direction);
    
    // 2. Délai pour laisser l'animation se jouer
    setTimeout(() => {
        onAnswer(value, question);
        setExitX(0);
        setFreeText(""); // Reset champ texte
    }, 200);
  };

  const cardVariants = {
    initial: { scale: 0.9, y: 50, opacity: 0 },
    animate: { scale: 1, y: 0, opacity: 1 },
    exit: { x: exitX, opacity: 0, rotate: exitX > 0 ? 10 : -10, transition: { duration: 0.2 } }
  };

  return (
    <div style={{ position: 'relative', height: '450px', perspective: '1000px' }}>
      <AnimatePresence mode='wait'>
        <motion.div
          key={question.uniqueId || question.id} 
          variants={cardVariants}
          initial="initial" animate="animate" exit="exit"
          className="pro-card"
          style={{ 
            position: 'absolute', inset: 0, zIndex: 10,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            borderTop: question.targetField ? '4px solid var(--warning)' : (question.sensitive ? '4px solid var(--danger)' : '4px solid var(--primary)'),
            background: 'var(--glass-bg)'
          }}
        >
          {/* --- HEADER --- */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="tech-font" style={{ 
                    color: question.targetField ? 'var(--warning)' : 'var(--primary)', 
                    letterSpacing: '2px', fontSize: '0.8rem' 
                }}>
                    /// {question.tag || "STANDARD"} ///
                </span>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>+{question.reward || 50} $</div>
                </div>
            </div>

            <h2 style={{ marginTop: '1.5rem', fontSize: '1.3rem', lineHeight: '1.4' }}>
                {question.text}
            </h2>
          </div>

          {/* --- ZONE DE RÉPONSE --- */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px' }}>
            
            {/* OPTION A : QCM */}
            {question.type === 'qcm' && question.options.map((opt, i) => (
              <button 
                key={i} 
                className="btn-secondary" 
                onClick={() => handleSubmit(opt)}
                style={{ textAlign: 'left', padding: '15px' }}
              >
                <span style={{ color: 'var(--primary)', marginRight: '10px' }}>{i + 1}.</span> {opt}
              </button>
            ))}

            {/* OPTION B : TEXTE LIBRE */}
            {question.type === 'free' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <textarea 
                  rows="3"
                  className="w-full"
                  placeholder={question.placeholder || "Saisissez votre réponse..."}
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  style={{ 
                    background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', 
                    color: 'white', padding: '15px', borderRadius: '4px', resize: 'none'
                  }}
                />
                <button 
                    className="btn-main" 
                    onClick={() => handleSubmit(freeText)}
                    disabled={!freeText.trim()}
                >
                    VALIDER LA TRANSMISSION
                </button>
              </div>
            )}
          </div>

          {/* --- FOOTER QUOTA --- */}
          <div style={{ marginTop: '1rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '5px', color: 'var(--text-muted)' }}>
                <span>QUOTA JOURNALIER</span>
                <span>{currentCount} / 5</span>
             </div>
             <div style={{ background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentCount / 5) * 100}%` }}
                    style={{ background: currentCount >= 5 ? 'var(--danger)' : 'var(--success)', height: '100%' }} 
                />
             </div>
          </div>

        </motion.div>
      </AnimatePresence>

      {/* DÉCORATION FOND */}
      <div style={{ position: 'absolute', top: '15px', left: '10px', right: '10px', bottom: '-10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', zIndex: 1, transform: 'scale(0.95)' }} />
    </div>
  );
}