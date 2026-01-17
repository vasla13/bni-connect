import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { X, CheckCircle, ArrowRight } from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

export default function FormRunnerModal({ form, onClose, user }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentValue, setCurrentValue] = useState("");
  const [completed, setCompleted] = useState(false);
  const { width, height } = useWindowSize();

  const questions = form.questions || [];
  const currentQ = questions[step];

  const handleNext = async () => {
    // Sauvegarde la réponse locale
    const newAnswers = { ...answers, [currentQ.text]: currentValue };
    setAnswers(newAnswers);
    setCurrentValue("");

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      // FIN DU FORMULAIRE
      try {
          const submitForm = httpsCallable(functions, 'submitTask'); // On réutilise submitTask ou une nouvelle fonction
          // Pour faire simple, on envoie comme une "grosse" réponse
          await submitForm({ 
              questionData: { ...form, type: 'form_submission' }, // On triche un peu pour utiliser la même cloud function
              answer: JSON.stringify(newAnswers) 
          });
          setCompleted(true);
      } catch (e) {
          console.error(e);
          alert("Erreur envoi: " + e.message);
      }
    }
  };

  if (completed) {
      return (
        <div className="overlay">
            <Confetti width={width} height={height} recycle={false} />
            <div className="modal-box">
                <div style={{ color: 'var(--success)', marginBottom: '20px' }}><CheckCircle size={60} /></div>
                <h2 className="tech-font">TRANSMISSION RÉUSSIE</h2>
                <p>Vos réponses ont été envoyées au serveur central.</p>
                <button className="btn-main mt-4" onClick={onClose}>RETOUR AU TABLEAU DE BORD</button>
            </div>
        </div>
      );
  }

  if (!currentQ) return null; // Sécurité

  return (
    <div className="overlay">
        <div className="modal-box" style={{ maxWidth: '600px', textAlign: 'left', position: 'relative' }}>
            <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#fff' }}>
                <X size={24} />
            </button>

            <div style={{ marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
                <h3 className="tech-font" style={{ color: form.color, margin: 0 }}>{form.title}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8', marginTop: '5px' }}>
                    <span>QUESTION {step + 1} / {questions.length}</span>
                    <span>GAIN : {form.reward}</span>
                </div>
                <div className="progress" style={{ marginTop: '10px', height: '4px' }}>
                    <span style={{ width: `${((step + 1) / questions.length) * 100}%`, background: form.color }}></span>
                </div>
            </div>

            <h2 style={{ fontSize: '1.3rem', marginBottom: '20px' }}>{currentQ.text}</h2>

            {/* TYPES D'INPUTS */}
            <div style={{ minHeight: '150px' }}>
                {currentQ.type === 'text' && (
                    <textarea 
                        className="w-full" rows={4} autoFocus
                        placeholder="Votre réponse..."
                        value={currentValue}
                        onChange={e => setCurrentValue(e.target.value)}
                    />
                )}
                
                {currentQ.type === 'qcm' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {currentQ.options.map(opt => (
                            <button 
                                key={opt} 
                                className="btn-secondary"
                                style={{ 
                                    textAlign: 'left', 
                                    borderColor: currentValue === opt ? form.color : '#334155',
                                    background: currentValue === opt ? 'rgba(255,255,255,0.1)' : 'transparent'
                                }}
                                onClick={() => setCurrentValue(opt)}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                )}

                {currentQ.type === 'range' && (
                    <div style={{ padding: '20px 0' }}>
                        <input 
                            type="range" min="0" max="10" 
                            className="w-full" 
                            value={currentValue || 5} 
                            onChange={e => setCurrentValue(e.target.value)}
                        />
                        <div style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 'bold', color: form.color }}>
                            {currentValue || 5} / 10
                        </div>
                    </div>
                )}

                {currentQ.type === 'image' && (
                    <div>
                        <input 
                            className="w-full" 
                            placeholder="https://imgur.com/..." 
                            value={currentValue}
                            onChange={e => setCurrentValue(e.target.value)}
                        />
                        {currentValue && (
                            <img src={currentValue} alt="Preuve" style={{ width: '100%', height: '150px', objectFit: 'cover', marginTop: '10px', borderRadius: '8px' }} onError={(e) => e.target.style.display='none'} />
                        )}
                    </div>
                )}
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                    className="btn-main" 
                    style={{ background: form.color, borderColor: form.color, color: '#000' }}
                    onClick={handleNext}
                    disabled={!currentValue}
                >
                    {step === questions.length - 1 ? "TERMINER & ENVOYER" : "SUIVANT"} <ArrowRight size={18} style={{ marginLeft: '5px' }} />
                </button>
            </div>
        </div>
    </div>
  );
}