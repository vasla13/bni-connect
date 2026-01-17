import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function GameCard({ user, question, onAnswer }) {
  const [exitX, setExitX] = useState(0);
  const [freeText, setFreeText] = useState("");

  const today = new Date().toLocaleDateString('fr-FR');
  const currentCount = (user.game && user.game.lastQuestionDate === today) ? user.game.dailyCount : 0;

  const handleSubmit = (value) => {
    const direction = Math.random() > 0.5 ? 200 : -200;
    setExitX(direction);
    setTimeout(() => {
        onAnswer(value, question);
        setExitX(0);
        setFreeText(""); 
    }, 200);
  };

  const cardVariants = {
    initial: { scale: 0.95, y: 20, opacity: 0 },
    animate: { scale: 1, y: 0, opacity: 1 },
    exit: { x: exitX, opacity: 0, transition: { duration: 0.2 } }
  };

  return (
    <div style={{ position: 'relative', height: '450px' }}>
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
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}
        >
          {/* HEADER */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ 
                    color: question.targetField ? 'var(--warning)' : 'var(--primary)', 
                    fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'uppercase'
                }}>
                    {question.tag || "STANDARD"}
                </span>
                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>
                    GAIN : {question.reward || 50} $
                </span>
            </div>

            <h2 style={{ marginTop: '1.5rem', fontSize: '1.3rem', lineHeight: '1.4', fontWeight: '500' }}>
                {question.text}
            </h2>
          </div>

          {/* CONTENU */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px' }}>
            {question.type === 'qcm' && question.options.map((opt, i) => (
              <button 
                key={i} 
                className="btn-secondary" 
                onClick={() => handleSubmit(opt)}
                style={{ textAlign: 'left', padding: '15px', background: 'rgba(255,255,255,0.03)' }}
              >
                {opt}
              </button>
            ))}

            {question.type === 'free' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <textarea 
                  rows="3"
                  className="w-full"
                  placeholder={question.placeholder || "Votre réponse..."}
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  style={{ 
                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', 
                    color: 'white', padding: '15px', borderRadius: '4px', resize: 'none'
                  }}
                />
                <button 
                    className="btn-main" 
                    onClick={() => handleSubmit(freeText)}
                    disabled={!freeText.trim()}
                >
                    ENVOYER LA RÉPONSE
                </button>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div style={{ marginTop: '1rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '5px', color: 'var(--text-muted)' }}>
                <span>Objectif Quotidien</span>
                <span>{currentCount} / 5</span>
             </div>
             <div style={{ background: 'rgba(255,255,255,0.1)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ 
                    width: `${(currentCount / 5) * 100}%`, 
                    background: currentCount >= 5 ? 'var(--warning)' : 'var(--success)', 
                    height: '100%', transition: 'width 0.3s' 
                }} />
             </div>
          </div>

        </motion.div>
      </AnimatePresence>
      
      {/* Effet d'empilement discret */}
      <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', bottom: '-5px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', zIndex: 1 }} />
    </div>
  );
}