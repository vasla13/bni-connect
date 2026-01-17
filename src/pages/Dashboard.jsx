import { useEffect, useState, useMemo } from 'react';
import { auth, db, functions } from '../firebase';
import { doc, onSnapshot, updateDoc, collection, query, orderBy, limit, addDoc, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { getQuestionPool } from '../data/questions'; 
import { useWindowSize } from 'react-use';
// SUPPRESSION DU CONFETTI ICI
import { ShieldCheck, FileText, Lock, Activity, Clock, AlertTriangle, Database } from 'lucide-react'; 

import UserProfileHeader from '../components/UserProfileHeader';
import GameCard from '../components/GameCard';
import HistorySection from '../components/HistorySection';
import InfoModal from '../components/InfoModal';
import EditProfileModal from '../components/EditProfileModal';

// MAPPING DES ICÔNES (Pour convertir le texte de la DB en composant)
const ICON_MAP = {
  'file': FileText,
  'lock': Lock,
  'shield': ShieldCheck,
  'alert': AlertTriangle,
  'db': Database,
  'activity': Activity
};

export default function Dashboard() {
  const navigate = useNavigate();
  // const { width, height } = useWindowSize(); // Plus besoin car plus de confetti
  
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [questionQueue, setQuestionQueue] = useState([]);
  const [forms, setForms] = useState([]); // Liste des formulaires chargés depuis la DB
  
  // const [showConfetti, setShowConfetti] = useState(false); // SUPPRIMÉ
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [modalInfo, setModalInfo] = useState({ open: false, title: '', msg: '' });

  // --- 1. DATA FETCHING ---
  useEffect(() => {
    if (!auth.currentUser) return navigate('/');
    
    // A. User
    const unsubUser = onSnapshot(doc(db, "users", auth.currentUser.uid), (doc) => {
      if (doc.exists()) setUser(doc.data());
    });

    // B. Historique
    const qHistory = query(collection(db, "users", auth.currentUser.uid, "history"), orderBy("date", "desc"), limit(10));
    const unsubHistory = onSnapshot(qHistory, (snap) => {
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // C. Virements en cours
    const qWithdrawals = query(
        collection(db, "withdrawals"), 
        where("userId", "==", auth.currentUser.uid),
        where("statut", "==", "pending")
    );
    const unsubWithdrawals = onSnapshot(qWithdrawals, (snap) => {
        setPendingWithdrawals(snap.docs.map(d => d.data()));
    });

    // D. FORMULAIRES (Chargement dynamique depuis Firestore)
    const qForms = query(collection(db, "forms")); // Tu peux ajouter un orderBy si tu veux
    const unsubForms = onSnapshot(qForms, (snap) => {
        setForms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubUser(); unsubHistory(); unsubWithdrawals(); unsubForms(); };
  }, [navigate]);

  const totalPendingAmount = useMemo(() => {
    return pendingWithdrawals.reduce((acc, curr) => acc + (curr.montant || 0), 0);
  }, [pendingWithdrawals]);

  // --- 2. JEU / TASKS ---
  useEffect(() => {
    if (questionQueue.length === 0) {
      const fullPool = getQuestionPool();
      const newDeck = Array.from({ length: 5 }).map((_, i) => {
        const rand = fullPool[Math.floor(Math.random() * fullPool.length)];
        return { ...rand, uniqueId: Date.now() + i }; 
      });
      setQuestionQueue(newDeck);
    }
  }, [questionQueue.length]);

  // --- ACTIONS ---
  const handleAnswer = async (ans, currentQuestion) => {
    const nextQueue = questionQueue.slice(1);
    setQuestionQueue(nextQueue);
    try {
        const submitTask = httpsCallable(functions, 'submitTask');
        const result = await submitTask({ answer: ans, questionData: currentQuestion });
        if (result.data.success) {
            // Plus de confetti, juste une notif discrète ou rien
            // setShowConfetti(true); 
        } else {
            setModalInfo({ open: true, title: "QUOTA ATTEINT", msg: result.data.message });
        }
    } catch (error) { console.error(error); }
  };

  const handleWithdraw = async () => {
    if (!user || user.economy.enAttente < 2000) return;
    try {
      await addDoc(collection(db, "withdrawals"), {
        userId: auth.currentUser.uid,
        nomComplet: `${user.info.prenom} ${user.info.nom}`,
        banque: user.info.banque,
        telephone: user.info.telephone,
        montant: user.economy.enAttente,
        date: new Date().toISOString(),
        statut: 'pending'
      });
      await updateDoc(doc(db, "users", auth.currentUser.uid), { 
          "economy.statutRetrait": "waiting", "economy.enAttente": 0 
      });
      setModalInfo({ open: true, title: "TRANSMISSION", msg: "Demande transmise à l'administration." });
    } catch (e) { console.error(e); }
  };

  const handleSaveProfile = async (newInfo) => {
    try {
        await updateDoc(doc(db, "users", auth.currentUser.uid), { info: newInfo });
        setIsEditOpen(false);
    } catch (e) { console.error(e); }
  };

  if (!user) return <div className="flex-center tech-font">CONNEXION AU RÉSEAU...</div>;

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}> 
      
      {/* PLUS DE CONFETTI */}

      <UserProfileHeader 
        user={user} 
        onEdit={() => setIsEditOpen(true)}
        onShowHistory={() => setIsHistoryOpen(true)}
        onLogout={() => { signOut(auth); navigate('/'); }} 
      />

      <div className="grid-2" style={{ alignItems: 'start', marginTop: '2rem' }}>
        
        {/* GAUCHE : FLUX DE TÂCHES */}
        <div>
           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
             <h3 className="tech-font" style={{ margin: 0, fontSize: '1.2rem', color: 'var(--primary)' }}>/// TÂCHES RAPIDES</h3>
             <div style={{ display: 'flex', gap: '5px' }}>
                {[...Array(3)].map((_, i) => (
                    <div key={i} style={{ width: '8px', height: '8px', background: i === 0 ? 'var(--success)' : '#334155', borderRadius: '50%' }}></div>
                ))}
             </div>
           </div>

           {questionQueue.length > 0 ? (
             <GameCard user={user} question={questionQueue[0]} onAnswer={handleAnswer} />
           ) : (
             <div className="pro-card text-center" style={{ padding: '4rem 2rem', border: '1px dashed #334155' }}>
               <h2 className="text-muted mb-4" style={{ opacity: 0.5 }}>AUCUNE TÂCHE</h2>
               <button className="btn-secondary" onClick={() => window.location.reload()}>RECHERCHER DE NOUVELLES TÂCHES</button>
             </div>
           )}
        </div>

        {/* DROITE : PORTEFEUILLE COMPLET */}
        <div>
            <h3 className="tech-font" style={{ marginBottom: '1rem', fontSize: '1.2rem', color: 'var(--primary)' }}>/// FINANCE</h3>
            
            <div className="pro-card" style={{ borderLeft: '4px solid var(--primary)', position: 'relative', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               <div style={{ position: 'absolute', right: '10px', top: '10px', opacity: 0.05 }}>
                  <ShieldCheck size={120} />
               </div>

               {/* 1. EN ATTENTE DE VALIDATION */}
               <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ color: 'var(--primary)', marginBottom: 0 }}>EN ATTENTE DE VALIDATION</label>
                        <Activity size={16} color="var(--primary)"/>
                   </div>
                   <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', margin: '10px 0' }}>
                       <h2 style={{ fontSize: '3rem', margin: 0, fontFamily: 'Rajdhani', lineHeight: 1, color: '#fff' }}>
                          {user.economy.enAttente}
                       </h2>
                       <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>$</span>
                   </div>
                   
                   {user.economy.enAttente >= 2000 ? (
                       <button className="btn-main" onClick={handleWithdraw}>
                          DEMANDER LA VALIDATION
                       </button>
                   ) : (
                       <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                          (Minimum 2000$ pour valider)
                       </div>
                   )}
               </div>

               {/* 2. ATTENTE DE PAIEMENT */}
               <div style={{ 
                   background: 'rgba(245, 158, 11, 0.1)', 
                   border: '1px solid rgba(245, 158, 11, 0.3)', 
                   padding: '12px', borderRadius: '4px',
                   display: 'flex', justifyContent: 'space-between', alignItems: 'center'
               }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                       <Clock size={20} color="var(--warning)"/>
                       <div>
                           <div style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 'bold' }}>ATTENTE DE PAIEMENT</div>
                           <div style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>Virements émis</div>
                       </div>
                   </div>
                   <span style={{ fontFamily: 'Rajdhani', fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--warning)' }}>
                       {totalPendingAmount} $
                   </span>
               </div>

               {/* 3. MONTANT DÉJÀ VALIDÉ */}
               <div style={{ 
                   background: 'rgba(16, 185, 129, 0.1)', 
                   border: '1px solid rgba(16, 185, 129, 0.3)', 
                   padding: '12px', borderRadius: '4px',
                   display: 'flex', justifyContent: 'space-between', alignItems: 'center'
               }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                       <ShieldCheck size={20} color="#10b981"/>
                       <div>
                           <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold' }}>FONDS SÉCURISÉS</div>
                           <div style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>Reçu en banque</div>
                       </div>
                   </div>
                   <span style={{ fontFamily: 'Rajdhani', fontSize: '1.3rem', fontWeight: 'bold', color: '#fff' }}>
                       {user.economy.gagneTotal || 0} $
                   </span>
               </div>
            </div>
        </div>
      </div>

      {/* --- SECTION FORMULAIRES (DYNAMIQUE) --- */}
      <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #1e293b' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 className="tech-font" style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-main)' }}>
                /// FORMULAIRES DISPONIBLES
            </h3>
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>SYNC. SERVER: ONLINE</span>
         </div>

         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
             
             {forms.length === 0 && (
                 <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', color: '#64748b', border: '1px dashed #334155', borderRadius: '8px' }}>
                     AUCUN FORMULAIRE SPÉCIAL DISPONIBLE POUR LE MOMENT.
                 </div>
             )}

             {forms.map((form) => {
                 // Récupération de l'icône, ou FileText par défaut
                 const IconComponent = ICON_MAP[form.icon] || FileText;
                 
                 return (
                    <div key={form.id} className="pro-card" style={{ borderColor: form.color || 'var(--primary)', cursor: 'pointer', transition: '0.3s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <IconComponent size={24} color={form.color || 'var(--primary)'}/>
                            <span style={{ color: form.color || 'var(--primary)', fontWeight: 'bold', fontFamily: 'Rajdhani', fontSize: '1.1rem' }}>
                                {form.reward}
                            </span>
                        </div>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>{form.title}</h4>
                        <p style={{ fontSize: '0.85rem', color: '#64748b' }}>{form.desc}</p>
                        <div style={{ marginTop: '15px' }}>
                            <button 
                                className="btn-secondary w-full" 
                                style={{ 
                                    borderColor: form.color || 'var(--primary)', 
                                    color: form.color || 'var(--primary)',
                                    background: `rgba(255, 255, 255, 0.05)`
                                }}
                            >
                                REMPLIR LE FORMULAIRE
                            </button>
                        </div>
                    </div>
                 );
             })}

         </div>
      </div>

      {/* MODALES */}
      {modalInfo.open && <InfoModal title={modalInfo.title} msg={modalInfo.msg} onClose={() => setModalInfo({ ...modalInfo, open: false })} />}
      {isEditOpen && <EditProfileModal user={user} onClose={() => setIsEditOpen(false)} onSave={handleSaveProfile} />}
      
      {isHistoryOpen && (
        <div className="overlay" onClick={() => setIsHistoryOpen(false)}>
            <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <h3 className="tech-font mb-4">JOURNAL DES TRANSACTIONS</h3>
                <div style={{ maxHeight: '400px', overflowY: 'auto', textAlign: 'left' }}>
                    <HistorySection history={history} />
                </div>
                <button className="btn-secondary w-full mt-4" onClick={() => setIsHistoryOpen(false)}>FERMER LE JOURNAL</button>
            </div>
        </div>
      )}

    </div>
  );
}