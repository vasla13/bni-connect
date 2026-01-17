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

export default function Dashboard() {
  const navigate = useNavigate();
  const { width, height } = useWindowSize();
  
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [questionQueue, setQuestionQueue] = useState([]);
  
  const [showConfetti, setShowConfetti] = useState(false);
  const [modalInfo, setModalInfo] = useState({ open: false, title: '', msg: '' });

  // 1. Chargement Données
  useEffect(() => {
    if (!auth.currentUser) return navigate('/');
    
    // User
    const unsubUser = onSnapshot(doc(db, "users", auth.currentUser.uid), (doc) => {
      if (doc.exists()) setUser(doc.data());
    });

    // Historique
    const q = query(collection(db, "users", auth.currentUser.uid, "history"), orderBy("date", "desc"), limit(5));
    const unsubHistory = onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubUser(); unsubHistory(); };
  }, [navigate]);

  // 2. Initialisation Deck
  useEffect(() => {
    if (questionQueue.length === 0) {
      const fullPool = getQuestionPool();
      // On prend 5 questions pour la pile locale
      const newDeck = Array.from({ length: 5 }).map((_, i) => {
        const rand = fullPool[Math.floor(Math.random() * fullPool.length)];
        return { ...rand, uniqueId: Date.now() + i }; 
      });
      setQuestionQueue(newDeck);
    }
  }, [questionQueue.length]);

  // 3. Gestion Réponse
  const handleAnswer = async (ans, currentQuestion) => {
    // UI Optimiste : passer à la suivante
    const nextQueue = questionQueue.slice(1);
    setQuestionQueue(nextQueue);

    try {
        const submitTask = httpsCallable(functions, 'submitTask');
        // On envoie la réponse et les infos de la question (pour vérifier si c'est un questionnaire ou random)
        const result = await submitTask({ 
            answer: ans, 
            questionData: currentQuestion 
        });
        
        if (result.data.success) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 2000);
        } else {
            // Si quota atteint pour les questions random
            setModalInfo({ open: true, title: "LIMITE ATTEINTE", msg: result.data.message });
        }
    } catch (error) {
        console.error(error);
        setModalInfo({ open: true, title: "ERREUR", msg: "Erreur de transmission." });
    }
  };

  // 4. Gestion Retrait (Logique > 2000$)
  const handleWithdraw = async () => {
    // Sécurité Front
    if (!user || user.economy.enAttente < 2000) return;

    try {
      // Création de la demande Admin
      await addDoc(collection(db, "withdrawals"), {
        userId: auth.currentUser.uid,
        nomComplet: `${user.info.prenom} ${user.info.nom}`,
        banque: user.info.banque,
        telephone: user.info.telephone,
        montant: user.economy.enAttente, // On fige le montant demandé
        date: new Date().toISOString(),
        statut: 'pending'
      });
      
      // Historique local
      await addDoc(collection(db, "users", auth.currentUser.uid, "history"), {
        type: 'withdraw', label: 'Demande de virement', montant: -user.economy.enAttente, date: new Date().toISOString()
      });

      // Reset Solde local + Statut Waiting
      // Note: Le backend pourrait faire ça pour plus de sécu, mais on le fait ici pour l'UI immédiate
      await updateDoc(doc(db, "users", auth.currentUser.uid), { 
          "economy.statutRetrait": "waiting",
          "economy.enAttente": 0 // On remet à zéro visuellement (l'argent est "bloqué" dans la demande)
      });
      
      setModalInfo({ open: true, title: "DEMANDE ENVOYÉE", msg: "Virement en attente de validation admin." });
    } catch (e) { console.error(e); }
  };

  if (!user) return <div className="flex-center">Chargement système...</div>;

  return (
    <div className="container">
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} />}

      <UserProfileHeader user={user} onLogout={() => { signOut(auth); navigate('/'); }} />

      <div className="grid-2" style={{ alignItems: 'start' }}>
        
        {/* GAUCHE : LE JEU (Swipe) */}
        <div>
           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
             <h3 className="text-cyan">TÂCHE EN COURS</h3>
             <span className="text-muted">FILE : {questionQueue.length}</span>
           </div>
           {questionQueue.length > 0 ? (
             <GameCard user={user} question={questionQueue[0]} onAnswer={handleAnswer} />
           ) : (
             <div className="pro-card text-center" style={{ padding: '3rem' }}>
               <h2 className="text-muted">FILE VIDE</h2>
               <button className="btn-main mt-4" onClick={() => window.location.reload()}>ACTUALISER</button>
             </div>
           )}
        </div>

        {/* DROITE : PORTEFEUILLE & INFO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* CARTE PORTEFEUILLE SPECIALE */}
            <div className="pro-card" style={{ borderLeft: '4px solid var(--primary)' }}>
               <h3 className="text-cyan">ARGENT EN ATTENTE</h3>
               
               <div style={{ marginTop: '1rem' }}>
                 <h2 style={{ fontSize: '3rem', margin: 0, letterSpacing: '2px' }}>
                    {user.economy.enAttente} $
                 </h2>
                 <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '5px' }}>
                    Seuil minimum : 2000 $
                 </p>
               </div>

               <div style={{ marginTop: '1.5rem' }}>
                 {user.economy.statutRetrait === 'waiting' ? (
                   <button className="btn-warning w-full" disabled style={{ opacity: 1, cursor: 'wait', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                      <span className="loader">⌛</span> EN ATTENTE DE PAIEMENT
                   </button>
                 ) : (
                   <button 
                     className="btn-main w-full" 
                     onClick={handleWithdraw}
                     disabled={user.economy.enAttente < 2000}
                     style={{ 
                        filter: user.economy.enAttente < 2000 ? 'grayscale(1) opacity(0.5)' : 'none',
                        cursor: user.economy.enAttente < 2000 ? 'not-allowed' : 'pointer'
                     }}
                   >
                     {user.economy.enAttente < 2000 ? `IL MANQUE ${2000 - user.economy.enAttente} $` : "RÉCUPÉRER MON ARGENT"}
                   </button>
                 )}
               </div>
            </div>

            {/* LISTE DES QUESTIONNAIRES DISPO */}
            <div className="pro-card">
                <h3 className="text-muted mb-4">À VENIR</h3>
                {questionQueue.slice(1).map((q, i) => (
                    <div key={q.uniqueId} style={{ padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--primary)', marginRight: '10px' }}>#{i+2}</span>
                        {q.text.substring(0, 30)}...
                    </div>
                ))}
            </div>

        </div>
      </div>

      <HistorySection history={history} />

      {modalInfo.open && <InfoModal title={modalInfo.title} msg={modalInfo.msg} onClose={() => setModalInfo({ ...modalInfo, open: false })} />}
    </div>
  );
}