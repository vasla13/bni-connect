import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { X, CheckCircle, ArrowRight, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { useWindowSize } from 'react-use';
import Confetti from 'react-confetti';

export default function FormRunnerModal({ form, onClose }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentValue, setCurrentValue] = useState(""); // Stocke la réponse actuelle
  const [completed, setCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { width, height } = useWindowSize();

  const questions = form.questions || [];
  const currentQ = questions[step];

  // Progression en pourcentage
  const progress = ((step + 1) / questions.length) * 100;

  const handleNext = async () => {
    // 1. Sauvegarde la réponse locale
    const newAnswers = { ...answers, [currentQ.text]: currentValue };
    setAnswers(newAnswers);
    
    // 2. Reset du champ pour la prochaine question
    setCurrentValue("");

    // 3. Navigation ou Soumission
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      // C'est la fin : Envoi au serveur
      setIsSubmitting(true);
      try {
          const submitTask = httpsCallable(functions, 'submitTask');
          
          // On envoie tout le paquet de réponses en une fois
          await submitTask({ 
              questionData: { ...form, type: 'form_submission' }, 
              answer: JSON.stringify(newAnswers) 
          });
          
          setCompleted(true);
      } catch (e) {
          console.error(e);
          alert("Erreur lors de la transmission : " + e.message);
          setIsSubmitting(false);
      }
    }
  };

  // --- VUE : SUCCÈS ---
  if (completed) {
      return (
        <div className="overlay" style={{ zIndex: 9999 }}>
            <Confetti width={width} height={height} recycle={false} numberOfPieces={300} colors={[form.color || '#38bdf8', '#ffffff']} />
            <div className="modal-box" style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ color: 'var(--success)', marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                    <CheckCircle size={80} strokeWidth={1.5} />
                </div>
                <h2 className="tech-font" style={{ fontSize: '2rem', marginBottom: '10px' }}>TRANSMISSION RÉUSSIE</h2>
                <p className="text-muted" style={{ marginBottom: '30px' }}>Le dossier a été archivé dans la base centrale.</p>
                <button className="btn-main" onClick={onClose}>RETOUR AU TABLEAU DE BORD</button>
            </div>
        </div>
      );
  }

  if (!currentQ) return null;

  return (
    <div className="overlay" style={{ backdropFilter: 'blur(8px)', background: 'rgba(5, 15, 41, 0.85)' }}>
        <div className="modal-box" style={{ 
            maxWidth: '700px', width: '95%', 
            padding: '0', 
            border: `1px solid ${form.color || 'var(--primary)'}`,
            boxShadow: `0 0 40px ${form.color}20`,
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            maxHeight: '90vh'
        }}>
            
            {/* --- HEADER --- */}
            <div style={{ 
                padding: '1.5rem', 
                background: 'rgba(0,0,0,0.3)', 
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                position: 'relative'
            }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                    <X size={24} />
                </button>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ 
                        background: form.color || 'var(--primary)', color: '#000', 
                        padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' 
                    }}>
                        DOSSIER CONFIDENTIEL
                    </span>
                    <span className="tech-font" style={{ color: form.color, fontSize: '1.1rem' }}>{form.title}</span>
                </div>

                {/* Barre de Progression Style "Scan" */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginTop: '15px', marginBottom: '5px' }}>
                    <span>QUESTION {step + 1} <span style={{ opacity: 0.5 }}>/ {questions.length}</span></span>
                    <span>{Math.round(progress)}% COMPLÉTÉ</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ 
                        width: `${progress}%`, height: '100%', 
                        background: form.color || 'var(--primary)',
                        boxShadow: `0 0 10px ${form.color}`,
                        transition: 'width 0.3s ease'
                    }}></div>
                </div>
            </div>

            {/* --- CORPS DE LA QUESTION (Scrollable) --- */}
            <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
                
                {/* 1. IMAGE D'ILLUSTRATION (Celle de l'Admin) */}
                {currentQ.imageUrl && (
                    <div style={{ 
                        marginBottom: '1.5rem', 
                        borderRadius: '8px', overflow: 'hidden', 
                        border: '1px solid #334155', background: '#000',
                        position: 'relative'
                    }}>
                        <img 
                            src={currentQ.imageUrl} 
                            alt="Preuve ou Contexte" 
                            style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', display: 'block' }} 
                            onError={(e) => e.target.style.display = 'none'}
                        />
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '5px 10px', background: 'rgba(0,0,0,0.7)', fontSize: '0.75rem', color: '#fff' }}>
                            <ImageIcon size={12} style={{ marginRight: '5px', verticalAlign: 'middle' }}/> PIÈCE JOINTE N°{step + 1}
                        </div>
                    </div>
                )}

                {/* 2. TEXTE DE LA QUESTION */}
                <h2 style={{ fontSize: '1.4rem', marginBottom: '2rem', lineHeight: '1.4', fontWeight: '600' }}>
                    {currentQ.text}
                </h2>

                {/* 3. INPUTS (Selon le type) */}
                <div>
                    {/* TYPE : TEXTE LIBRE */}
                    {currentQ.type === 'text' && (
                        <textarea 
                            className="w-full" rows={5} autoFocus
                            placeholder="Saisissez votre rapport détaillé ici..."
                            value={currentValue}
                            onChange={e => setCurrentValue(e.target.value)}
                            style={{ 
                                background: 'rgba(255,255,255,0.05)', border: '1px solid #334155', 
                                padding: '15px', borderRadius: '8px', color: '#fff', fontSize: '1rem' 
                            }}
                        />
                    )}
                    
                    {/* TYPE : QCM (Boutons cartes) */}
                    {currentQ.type === 'qcm' && (
                        <div style={{ display: 'grid', gap: '10px' }}>
                            {currentQ.options.map(opt => (
                                <button 
                                    key={opt} 
                                    onClick={() => setCurrentValue(opt)}
                                    style={{ 
                                        textAlign: 'left', padding: '15px 20px',
                                        border: currentValue === opt ? `2px solid ${form.color}` : '1px solid #334155',
                                        background: currentValue === opt ? `rgba(255,255,255,0.1)` : 'rgba(0,0,0,0.2)',
                                        color: currentValue === opt ? '#fff' : '#94a3b8',
                                        borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
                                        fontSize: '1rem', fontWeight: currentValue === opt ? 'bold' : 'normal',
                                        display: 'flex', alignItems: 'center', gap: '10px'
                                    }}
                                >
                                    <div style={{ 
                                        width: '20px', height: '20px', borderRadius: '50%', 
                                        border: `2px solid ${currentValue === opt ? form.color : '#475569'}`,
                                        display: 'grid', placeItems: 'center'
                                    }}>
                                        {currentValue === opt && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: form.color }}></div>}
                                    </div>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* TYPE : JAUGE (Slider) */}
                    {currentQ.type === 'range' && (
                        <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                <span style={{ fontSize: '3rem', fontWeight: 'bold', fontFamily: 'Rajdhani', color: form.color }}>
                                    {currentValue || 5}
                                </span>
                                <span style={{ color: '#64748b', fontSize: '1.2rem' }}> / 10</span>
                            </div>
                            <input 
                                type="range" min="0" max="10" 
                                className="w-full" 
                                style={{ accentColor: form.color, cursor: 'pointer' }}
                                value={currentValue || 5} 
                                onChange={e => setCurrentValue(e.target.value)}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', marginTop: '10px' }}>
                                <span>FAIBLE (0)</span>
                                <span>ÉLEVÉ (10)</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- FOOTER (Actions) --- */}
            <div style={{ 
                padding: '1.5rem', 
                borderTop: '1px solid rgba(255,255,255,0.1)', 
                background: 'rgba(0,0,0,0.2)',
                display: 'flex', justifyContent: 'flex-end'
            }}>
                <button 
                    className="btn-main" 
                    style={{ 
                        background: form.color || 'var(--primary)', 
                        borderColor: form.color, 
                        color: '#000',
                        width: 'auto', padding: '12px 30px',
                        display: 'flex', alignItems: 'center', gap: '10px'
                    }}
                    onClick={handleNext}
                    disabled={(!currentValue && currentValue !== 0) || isSubmitting}
                >
                    {isSubmitting ? (
                        "ENVOI EN COURS..."
                    ) : (
                        <>
                           {step === questions.length - 1 ? "TRANSMETTRE LE RAPPORT" : "QUESTION SUIVANTE"} 
                           <ArrowRight size={20} />
                        </>
                    )}
                </button>
            </div>

        </div>
    </div>
  );
}