import { ShieldCheck, FileText, Lock, Activity, AlertTriangle, Database, CheckCircle } from 'lucide-react';

const ICON_MAP = {
  'file': FileText, 'lock': Lock, 'shield': ShieldCheck,
  'alert': AlertTriangle, 'db': Database, 'activity': Activity
};

export default function FormsList({ forms, user, onSelect }) {
  
  // FONCTION CLÉ : Vérifie si le formulaire est déjà dans l'historique des réponses
  const isFormCompleted = (formId) => {
    if (!user.game || !user.game.answers) return false;
    return user.game.answers.some(ans => ans.questionId === formId);
  };

  return (
    <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #1e293b' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 className="tech-font" style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-main)' }}>
                /// FORMULAIRES & DOSSIERS
            </h3>
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>SYNC. SERVER: ONLINE</span>
         </div>

         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
             
             {forms.length === 0 && (
                 <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', color: '#64748b', border: '1px dashed #334155', borderRadius: '8px' }}>
                     AUCUN DOSSIER SPÉCIAL DISPONIBLE.
                 </div>
             )}

             {forms.map((form) => {
                 const IconComponent = ICON_MAP[form.icon] || FileText;
                 const completed = isFormCompleted(form.id); // Vrai si déjà fait

                 return (
                    <div key={form.id} className="pro-card" style={{ 
                        borderColor: completed ? '#334155' : (form.color || 'var(--primary)'), 
                        opacity: completed ? 0.6 : 1, // On grise un peu si fini
                        transition: '0.3s' 
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <IconComponent size={24} color={completed ? '#94a3b8' : (form.color || 'var(--primary)')}/>
                            <span style={{ 
                                color: completed ? '#94a3b8' : (form.color || 'var(--primary)'), 
                                fontWeight: 'bold', fontFamily: 'Rajdhani', fontSize: '1.1rem' 
                            }}>
                                {form.reward}
                            </span>
                        </div>
                        
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', textDecoration: completed ? 'line-through' : 'none' }}>
                            {form.title}
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>{form.desc}</p>
                        
                        <div style={{ marginTop: '15px' }}>
                            {completed ? (
                                <button className="btn-secondary w-full" disabled style={{ cursor: 'not-allowed', borderColor: 'transparent', color: '#10b981' }}>
                                    <CheckCircle size={16} style={{ marginRight: '5px', verticalAlign: 'text-bottom' }}/> DOSSIER CLOTURÉ
                                </button>
                            ) : (
                                <button 
                                    className="btn-secondary w-full" 
                                    onClick={() => onSelect(form)}
                                    style={{ 
                                        borderColor: form.color || 'var(--primary)', 
                                        color: form.color || 'var(--primary)',
                                        background: `rgba(255, 255, 255, 0.05)`
                                    }}
                                >
                                    OUVRIR LE DOSSIER
                                </button>
                            )}
                        </div>
                    </div>
                 );
             })}
         </div>
    </div>
  );
}