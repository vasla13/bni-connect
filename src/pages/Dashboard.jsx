import { useEffect, useState } from 'react';
import { auth, db, functions } from '../firebase';
import { doc, onSnapshot, updateDoc, collection, query, orderBy, limit, addDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { getQuestionPool } from '../data/questions'; 
import { useWindowSize } from 'react-use';
import Confetti from 'react-confetti';

import UserProfileHeader from '../components/UserProfileHeader';
import GameCard from '../components/GameCard';
import HistorySection from '../components/HistorySection';
import InfoModal from '../components/InfoModal';
import EditProfileModal from '../components/EditProfileModal';

export default function Dashboard() {
  const navigate = useNavigate();
  const { width, height } = useWindowSize();
  
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [questionQueue, setQuestionQueue] = useState([]);
  
  const [showConfetti, setShowConfetti] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [modalInfo, setModalInfo] = useState({ open: false, title: '', msg: '' });

  // 1. Chargement
  useEffect(() => {
    if (!auth.currentUser) return navigate('/');
    
    const unsubUser = onSnapshot(doc(db, "users", auth.currentUser.uid), (doc) => {
      if (doc.exists()) setUser(doc.data());
    });

    const q = query(collection(db, "users", auth.currentUser.uid, "history"), orderBy("date", "desc"), limit(5));
    const unsubHistory = onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubUser(); unsubHistory(); };
  }, [navigate]);

  // 2. Initialisation Liste
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

  // 3. Gestion Réponse
  const handleAnswer = async (ans, currentQuestion) => {
    const nextQueue = questionQueue.slice(1);
    setQuestionQueue(nextQueue);

    try {
        const submitTask = httpsCallable(functions, 'submitTask');
        const result = await submitTask({ answer: ans, questionData: currentQuestion });
        
        if (result.data.success) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 2000);
        } else {
            setModalInfo({ open: true, title: "LIMITE ATTEINTE", msg: result.data.message });
        }
    } catch (error) {
        console.error(error);
        setModalInfo({ open: true, title: "ERREUR", msg: "Une erreur est survenue." });
    }
  };

  // 4. Retrait
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
      await addDoc(collection(db, "users", auth.currentUser.uid, "history"), {
        type: 'withdraw', label: 'Demande de virement', montant: -user.economy.enAttente, date: new Date().toISOString()
      });
      await updateDoc(doc(db, "users", auth.currentUser.uid), { 
          "economy.statutRetrait": "waiting", "economy.enAttente": 0 
      });
      setModalInfo({ open: true, title: "DEMANDE ENVOYÉE", msg: "Votre demande de virement a été transmise." });
    } catch (e) { console.error(e); }
  };

  const handleSaveProfile = async (newInfo) => {
    try {
        await updateDoc(doc(db, "users", auth.currentUser.uid), { info: newInfo });
        setIsEditOpen(false);
        setModalInfo({ open: true, title: "SUCCÈS", msg: "Profil mis à jour." });
    } catch (e) { console.error(e); }
  };

  if (!user) return <div className="flex-center tech-font">INITIALISATION DU SYSTÈME...</div>;

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}> 
      
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} colors={['#38bdf8', '#0ea5e9', '#ffffff']} />}

      <UserProfileHeader 
        user={user} 
        onEdit={() => setIsEditOpen(true)} 
        onLogout={() => { signOut(auth); navigate('/'); }} 
      />

      <div className="grid-2" style={{ alignItems: 'start', marginTop: '2rem' }}>
        
        {/* GAUCHE : ZONE DE TRAVAIL (SONDAGE) */}
        <div>
           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
             <h3 className="text-cyan" style={{ margin: 0, fontSize: '1.1rem' }}>Flux de Tâches</h3>
             <span className="text-muted" style={{ border: '1px solid #334155', padding: '4px 8px', borderRadius: '4px' }}>
                EN ATTENTE : <span className="text-white">{questionQueue.length}</span>
             </span>
           </div>

           {questionQueue.length > 0 ? (
             <GameCard user={user} question={questionQueue[0]} onAnswer={handleAnswer} />
           ) : (
             <div className="pro-card text-center" style={{ padding: '4rem 2rem' }}>
               <h2 className="text-muted mb-4" style={{ opacity: 0.5 }}>AUCUNE DONNÉE</h2>
               <p className="mb-4 text-muted">Toutes les tâches disponibles ont été traitées.</p>
               <button className="btn-secondary" onClick={() => window.location.reload()}>RECHARGER LE FLUX</button>
             </div>
           )}
        </div>

        {/* DROITE : FINANCE & FILE D'ATTENTE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* CARTE SOLDE */}
            <div className="pro-card" style={{ borderLeft: '4px solid var(--primary)' }}>
               <h3 className="text-cyan" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>PORTEFEUILLE VIRTUEL</h3>
               
               <div style={{ padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.5rem' }}>
                 <h2 style={{ fontSize: '3.5rem', margin: 0, fontFamily: 'Rajdhani', lineHeight: 1 }}>
                    {user.economy.enAttente} <span style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>$</span>
                 </h2>
               </div>
               
               <div style={{ marginBottom: '1rem' }}>
                 {user.economy.statutRetrait === 'waiting' ? (
                   <button className="btn-warning" disabled>
                      TRAITEMENT EN COURS...
                   </button>
                 ) : (
                   <button 
                     className="btn-main" 
                     onClick={handleWithdraw}
                     disabled={user.economy.enAttente < 2000}
                     style={{ 
                        opacity: user.economy.enAttente < 2000 ? 0.5 : 1,
                        background: user.economy.enAttente < 2000 ? '#1e293b' : 'var(--primary)',
                        color: user.economy.enAttente < 2000 ? '#64748b' : '#0f172a',
                        border: user.economy.enAttente < 2000 ? '1px solid #334155' : 'none'
                     }}
                   >
                     {user.economy.enAttente < 2000 ? `MINIMUM REQUIS : 2000 $` : "INITIER VIREMENT BANCAIRE"}
                   </button>
                 )}
               </div>
               
               <p className="text-center text-muted" style={{ fontSize: '0.75rem', margin: 0 }}>
                  TRANSACTION SÉCURISÉE PAR BNI-NET
               </p>
            </div>

            {/* LISTE DES PROCHAINES QUESTIONS */}
            <div className="pro-card" style={{ padding: '0' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(56, 189, 248, 0.1)' }}>
                    <h3 className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>FILE D'ATTENTE</h3>
                </div>
                
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {questionQueue.slice(1).map((q, i) => (
                        <div key={q.uniqueId} style={{ 
                            padding: '1rem 1.5rem', 
                            borderBottom: '1px solid rgba(255,255,255,0.03)', 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.9rem' 
                        }}>
                            <span style={{ color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>
                                {q.text}
                            </span>
                            <span className="text-cyan font-mono" style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                                +{q.reward || 50}$
                            </span>
                        </div>
                    ))}
                    {questionQueue.length <= 1 && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontStyle: 'italic', fontSize: '0.9rem' }}>
                            File d'attente vide.
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      <div style={{ marginTop: '3rem' }}>
         <HistorySection history={history} />
      </div>

      {modalInfo.open && <InfoModal title={modalInfo.title} msg={modalInfo.msg} onClose={() => setModalInfo({ ...modalInfo, open: false })} />}
      {isEditOpen && <EditProfileModal user={user} onClose={() => setIsEditOpen(false)} onSave={handleSaveProfile} />}
    </div>
  );
}