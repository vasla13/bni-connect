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

  if (!user) return <div className="flex-center">Chargement...</div>;

  return (
    <div className="container" style={{ maxWidth: '1400px', padding: '0' }}> 
      
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} />}

      <UserProfileHeader 
        user={user} 
        onEdit={() => setIsEditOpen(true)} 
        onLogout={() => { signOut(auth); navigate('/'); }} 
      />

      <div style={{ padding: '2rem' }}> 
          <div className="grid-2" style={{ alignItems: 'start' }}>
            
            {/* GAUCHE : SONDAGE */}
            <div>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                 <h3 className="text-cyan" style={{ margin: 0 }}>QUESTIONNAIRE EN COURS</h3>
                 <span className="text-muted" style={{ fontSize: '0.9rem' }}>EN ATTENTE : {questionQueue.length}</span>
               </div>

               {questionQueue.length > 0 ? (
                 <GameCard user={user} question={questionQueue[0]} onAnswer={handleAnswer} />
               ) : (
                 <div className="pro-card text-center" style={{ padding: '3rem' }}>
                   <h3 className="text-muted">AUCUN QUESTIONNAIRE</h3>
                   <p className="mb-4">Vous avez traité toutes les demandes disponibles.</p>
                   <button className="btn-main" onClick={() => window.location.reload()}>RAFRAÎCHIR LA LISTE</button>
                 </div>
               )}
            </div>

            {/* DROITE : SOLDE & INFO */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* SOLDE */}
                <div className="pro-card" style={{ borderLeft: '4px solid var(--primary)' }}>
                   <h3 className="text-cyan">SOLDE CUMULÉ</h3>
                   <div style={{ marginTop: '1rem' }}>
                     <h2 style={{ fontSize: '3rem', margin: 0 }}>{user.economy.enAttente} $</h2>
                     <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '5px' }}>Seuil de virement : 2000 $</p>
                   </div>
                   
                   <div style={{ marginTop: '1.5rem' }}>
                     {user.economy.statutRetrait === 'waiting' ? (
                       <button className="btn-warning w-full" disabled style={{ opacity: 1, cursor: 'default' }}>
                          ⏳ VIREMENT EN COURS
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
                         {user.economy.enAttente < 2000 ? "SOLDE INSUFFISANT" : "DEMANDER UN VIREMENT"}
                       </button>
                     )}
                   </div>
                </div>

                {/* LISTE */}
                <div className="pro-card">
                    <h3 className="text-muted mb-4">QUESTIONS DISPONIBLES</h3>
                    {questionQueue.slice(1).map((q, i) => (
                        <div key={q.uniqueId} style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{q.text.substring(0, 35)}...</span>
                            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>+50$</span>
                        </div>
                    ))}
                    {questionQueue.length <= 1 && <p className="text-muted text-center">Aucune autre question.</p>}
                </div>
            </div>
          </div>

          <HistorySection history={history} />
      </div>

      {modalInfo.open && <InfoModal title={modalInfo.title} msg={modalInfo.msg} onClose={() => setModalInfo({ ...modalInfo, open: false })} />}
      {isEditOpen && <EditProfileModal user={user} onClose={() => setIsEditOpen(false)} onSave={handleSaveProfile} />}
    </div>
  );
}