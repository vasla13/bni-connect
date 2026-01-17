// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { auth, db, functions } from '../firebase';
import { doc, onSnapshot, updateDoc, collection, arrayUnion, query, orderBy, limit, addDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { getQuestionPool } from '../data/questions'; // <--- IMPORT MODIFIÉ
import { useWindowSize } from 'react-use';
import Confetti from 'react-confetti';

import UserProfileHeader from '../components/UserProfileHeader';
import GameCard from '../components/GameCard';
import HistorySection from '../components/HistorySection';
import EditProfileModal from '../components/EditProfileModal';
import InfoModal from '../components/InfoModal';

export default function Dashboard() {
  const navigate = useNavigate();
  const { width, height } = useWindowSize();
  
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [questionQueue, setQuestionQueue] = useState([]); // Le deck
  
  const [showConfetti, setShowConfetti] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [modalInfo, setModalInfo] = useState({ open: false, title: '', msg: '' });

  // 1. Chargement User + History
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

  // 2. Initialisation du Deck via getQuestionPool
  useEffect(() => {
    if (questionQueue.length === 0) {
      const fullPool = getQuestionPool(); // Récupère tout (Random + Questionnaires)
      
      // On prend 5 questions au hasard dans le pool global
      // (Ou tu peux faire une logique pour prioriser les questionnaires)
      const newDeck = Array.from({ length: 5 }).map((_, i) => {
        const rand = fullPool[Math.floor(Math.random() * fullPool.length)];
        return { ...rand, uniqueId: Date.now() + i }; 
      });
      setQuestionQueue(newDeck);
    }
  }, [questionQueue.length]);

  // 3. Gestion de la réponse
  const handleAnswer = async (ans, currentQuestion) => {
    // UI Optimiste : On passe à la suivante
    const nextQueue = questionQueue.slice(1);
    setQuestionQueue(nextQueue);

    try {
        const submitTask = httpsCallable(functions, 'submitTask');
        // IMPORTANT : On envoie la réponse ET toute la config de la question (pour targetField, reward...)
        const result = await submitTask({ 
            answer: ans, 
            questionData: currentQuestion 
        });
        
        if (result.data.success) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 2000);
        } else {
            setModalInfo({ open: true, title: "QUOTA ATTEINT", msg: result.data.message });
        }
    } catch (error) {
        console.error(error);
        setModalInfo({ open: true, title: "ERREUR", msg: "Connexion serveur échouée." });
    }
  };

  // 4. Retrait
  const handleWithdraw = async () => {
    if (!user || user.economy.enAttente <= 0) return;
    try {
      await addDoc(collection(db, "withdrawals"), {
        userId: auth.currentUser.uid,
        nomComplet: `${user.info.prenom} ${user.info.nom}`,
        montant: user.economy.enAttente,
        date: new Date().toISOString(),
        statut: 'pending'
      });
      await addDoc(collection(db, "users", auth.currentUser.uid, "history"), {
        type: 'withdraw', label: 'Retrait initié', montant: -user.economy.enAttente, date: new Date().toISOString()
      });
      await updateDoc(doc(db, "users", auth.currentUser.uid), { "economy.statutRetrait": "waiting" });
      setModalInfo({ open: true, title: "VIREMENT INITIÉ", msg: "Demande en cours." });
    } catch (e) { console.error(e); }
  };

  const handleSaveProfile = async (newInfo) => {
    await updateDoc(doc(db, "users", auth.currentUser.uid), { info: newInfo });
    setIsEditOpen(false);
  };

  if (!user) return <div className="flex-center">Chargement...</div>;

  return (
    <div className="container">
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} />}

      <UserProfileHeader user={user} onEdit={() => setIsEditOpen(true)} onLogout={() => { signOut(auth); navigate('/'); }} />

      <div className="grid-2" style={{ alignItems: 'start' }}>
        
        {/* COLONNE GAUCHE : CARTE ACTIVE */}
        <div>
           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
             <h3 className="text-cyan">TÂCHE EN COURS</h3>
             <span className="text-muted">EN FILE : {questionQueue.length}</span>
           </div>
           {questionQueue.length > 0 ? (
             <GameCard user={user} question={questionQueue[0]} onAnswer={handleAnswer} />
           ) : (
             <div className="pro-card text-center" style={{ padding: '3rem' }}>
               <h2 className="text-muted">FLUX VIDE</h2>
               <button className="btn-main mt-4" onClick={() => window.location.reload()}>RECHARGER</button>
             </div>
           )}
        </div>

        {/* COLONNE DROITE : INFO & WALLET */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="pro-card">
               <h3 className="text-cyan">PORTEFEUILLE</h3>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                 <h2 style={{ fontSize: '2.5rem', margin: 0 }}>{user.economy.enAttente} $</h2>
                 {user.economy.statutRetrait === 'waiting' ? (
                   <span style={{ color: 'var(--warning)', border: '1px solid var(--warning)', padding: '5px' }}>EN COURS</span>
                 ) : (
                   <button className="btn-main" style={{ width: 'auto' }} onClick={handleWithdraw} disabled={user.economy.enAttente <= 0}>SÉCURISER</button>
                 )}
               </div>
            </div>

            <div className="pro-card" style={{ minHeight: '300px' }}>
                <h3 className="text-muted mb-4">À VENIR</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {questionQueue.slice(1).map((q, index) => (
                        <div key={q.uniqueId} style={{ 
                            padding: '12px', background: 'rgba(255,255,255,0.02)', 
                            borderLeft: q.targetField ? '3px solid var(--warning)' : '3px solid var(--text-muted)',
                            display: 'flex', justifyContent: 'space-between'
                        }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>{q.tag || "TÂCHE"}</div>
                                <div style={{ fontSize: '0.9rem' }}>{q.targetField ? "Mise à jour Profil" : "Enquête"}</div>
                            </div>
                            <div>➜</div>
                        </div>
                    ))}
                    {questionQueue.length <= 1 && <p className="text-muted text-center">Aucune autre tâche.</p>}
                </div>
            </div>
        </div>
      </div>

      <HistorySection history={history} />

      {modalInfo.open && <InfoModal title={modalInfo.title} msg={modalInfo.msg} onClose={() => setModalInfo({ ...modalInfo, open: false })} />}
      {isEditOpen && <EditProfileModal user={user} onClose={() => setIsEditOpen(false)} onSave={handleSaveProfile} />}
    </div>
  );
}