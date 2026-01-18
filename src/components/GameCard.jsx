import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ChevronRight, Send, DollarSign } from 'lucide-react';

// Petit composant interne pour l'effet machine à écrire
const Typewriter = ({ text, speed = 25 }) => {
  const [displayed, setDisplayed] = useState('');
  
  useEffect(() => {
    setDisplayed(''); // Reset quand le texte change
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      <span className="cursor-blink"></span>
    </span>
  );
};

export default function GameCard({ user, question, onAnswer }) {
  const [exitX, setExitX] = useState(0);
  const [freeText, setFreeText] = useState("");

  const today = new Date().toLocaleDateString('fr-FR');
  const currentCount = (user.game && user.game.lastQuestionDate === today) ? user.game.dailyCount : 0;

  const handleSubmit = (value) => {
    const direction = Math.random() > 0.5 ? 300 : -300;
    setExitX(direction);
    setTimeout(() => {
        onAnswer(value, question);
        setExitX(0);
        setFreeText(""); 
    }, 200);
  };

  const formatTag = (tag) => {
    if (!tag || tag === "SANS TAG" || tag.includes("RH_DISPO")) return "STANDARD";
    return tag.replace(/_/g, " ");
  };

  const cardVariants = {
    initial: { scale: 0.95, opacity: 0, y: 10 },
    animate: { scale: 1, opacity: 1, y: 0 },
    exit: { x: exitX, opacity: 0, transition: { duration: 0.2 } }
  };

  return (
    <div style={{ position: 'relative', height: '420px' }}> {/* Hauteur légèrement augmentée */}
      <AnimatePresence mode='wait'>
        <motion.div
          key={question.uniqueId || question.id} 
           variants={cardVariants}
           initial="initial" animate="animate" exit="exit"
           className="pro-card no-decor"
          style={{ 
            position: 'absolute', inset: 0, zIndex: 10,
            display: 'flex', flexDirection: 'column',
            borderTop: '4px solid var(--primary)',
            background: 'linear-gradient(180deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.95) 100%)',
            padding: '1.5rem'
          }}
        >
          {/* --- NOUVEAU HEADER --- */}
          <div className="mission-header">
            <div>
                <div className="mission-tag">/// CLASSIFICATION : {formatTag(question.tag)}</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>PRIORITÉ IMMÉDIATE</div>
            </div>
            
            {/* Le Badge Récompense GÉANT */}
            <div className="reward-badge">
                <span className="reward-label">PRIME</span>
                +{question.reward || 50} $
            </div>
          </div>

          {/* --- QUESTION (Typewriter) --- */}
          <div className="mission-text">
             <Typewriter text={question.text} />
          </div>

          {/* --- ZONE DE RÉPONSE --- */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center', marginTop: '1rem' }}>
            {question.type === 'qcm' ? (
                question.options.map((opt, i) => (
                  <button 
                    key={i} 
                    className="btn-secondary" 
                    onClick={() => handleSubmit(opt)}
                    style={{ 
                        textAlign: 'left', justifyContent: 'space-between', 
                        padding: '14px 16px', borderLeft: '2px solid transparent',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderLeft = '4px solid var(--primary)';
                        e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderLeft = '2px solid transparent';
                        e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span>{opt}</span>
                    <ChevronRight size={16} style={{ opacity: 0.5 }} />
                  </button>
                ))
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <textarea 
                  rows="3"
                  className="tech-font"
                  placeholder="SAISIR RAPPORT..."
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  style={{ resize: 'none', background: 'rgba(0,0,0,0.3)', border: '1px solid #334155' }}
                />
                <button className="btn-main" onClick={() => handleSubmit(freeText)} disabled={!freeText.trim()}>
                    <Send size={16}/> TRANSMETTRE
                </button>
              </div>
            )}
          </div>

          {/* --- FOOTER : PROGRESSION --- */}
          <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginBottom: '6px' }}>
                <span className="tech-font">QUOTA JOURNALIER</span>
                <span className="tech-font">{currentCount} / 5 COMPLÉTÉ</span>
             </div>
             <div className="progress" style={{ height: '4px', background: '#1e293b' }}>
                <motion.span 
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentCount / 5) * 100}%` }}
                    transition={{ duration: 1 }}
                    style={{ background: currentCount >= 5 ? 'var(--success)' : 'var(--primary)', boxShadow: 'none' }}
                />
             </div>
          </div>

        </motion.div>
      </AnimatePresence>
      
      {/* Effet de profondeur arrière */}
      <div style={{ 
          position: 'absolute', top: '10px', left: '10px', right: '10px', bottom: '-10px', 
          background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius)', zIndex: 0 
      }} />
    </div>
  );
}