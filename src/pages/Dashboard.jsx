import { useEffect, useState } from 'react';
import { auth, db, functions } from '../firebase';
import { doc, onSnapshot, updateDoc, collection, query, orderBy, limit, addDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { getQuestionPool } from '../data/questions'; 
import { useWindowSize } from 'react-use';
import Confetti from 'react-confetti';
import { ShieldCheck, FileText, Lock } from 'lucide-react'; // Icônes pour les nouveaux formulaires

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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false); // État pour la modale historique
  const [modalInfo, setModalInfo] = useState({ open: false, title: '', msg: '' });

  // --- CHARGEMENT DES DONNÉES ---
  useEffect(() => {
    if (!auth.currentUser) return navigate('/');
    
    // Écoute du profil utilisateur
    const unsubUser = onSnapshot(doc(db, "users", auth.currentUser.uid), (doc) => {
      if (doc.exists()) setUser(doc.data());
    });

    // Écoute de l'historique (pour la modale)
    const q = query(collection(db, "users", auth.currentUser.uid, "history"), orderBy("date", "desc"), limit(10));
    const unsubHistory = onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubUser(); unsubHistory(); };
  }, [navigate]);

  // --- INITIALISATION JEU ---
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
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 2000);
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
      setModalInfo({ open: true, title: "TRANSMISSION", msg: "Demande de virement envoyée au service financier." });
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
      
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} colors={['#38bdf8', '#ffffff']} />}

      <UserProfileHeader 
        user={user} 
        onEdit={() => setIsEditOpen(true)}
        onShowHistory={() => setIsHistoryOpen(true)}
        onLogout={() => { signOut(auth); navigate('/'); }} 
      />

      <div className="grid-2" style={{ alignItems: 'start', marginTop: '2rem' }}>
        
        {/* GAUCHE : FLUX DE TÂCHES (GameCard) */}
        <div>
           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
             <h3 className="tech-font" style={{ margin: 0, fontSize: '1.2rem', color: 'var(--primary)' }}>/// TÂCHES ACTIVES</h3>
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

        {/* DROITE : PORTEFEUILLE AMÉLIORÉ */}
        <div>
             <h3 className="tech-font" style={{ marginBottom: '1rem', fontSize: '1.2rem', color: 'var(--primary)' }}>/// FINANCE</h3>
            
            <div className="pro-card" style={{ borderLeft: '4px solid var(--primary)', position: 'relative' }}>
               {/* FOND DE CARTE TECH */}
               <div style={{ position: 'absolute', right: '10px', top: '10px', opacity: 0.1 }}>
                  <ShieldCheck size={100} />
               </div>

               {/* 1. SOLDE EN ATTENTE */}
               <div style={{ marginBottom: '2rem' }}>
                   <label>SOLDE TEMPORAIRE</label>
                   <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                       <h2 style={{ fontSize: '3.5rem', margin: 0, fontFamily: 'Rajdhani', lineHeight: 1, color: '#fff' }}>
                          {user.economy.enAttente}
                       </h2>
                       <span style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>$</span>
                   </div>
                   <div className="progress" style={{ marginTop: '10px', height: '4px' }}>
                       <span style={{ width: `${Math.min((user.economy.enAttente / 2000) * 100, 100)}%` }}></span>
                   </div>
               </div>

               {/* 2. BOUTON ACTION */}
               <div style={{ marginBottom: '2rem' }}>
                 {user.economy.statutRetrait === 'waiting' ? (
                   <button className="btn-warning" disabled>TRAITEMENT BANCAIRE EN COURS...</button>
                 ) : (
                   <button 
                     className="btn-main" 
                     onClick={handleWithdraw}
                     disabled={user.economy.enAttente < 2000}
                     style={{ 
                        opacity: user.economy.enAttente < 2000 ? 0.6 : 1,
                        background: user.economy.enAttente < 2000 ? '#1e293b' : 'var(--primary)',
                     }}
                   >
                     {user.economy.enAttente < 2000 ? `CIBLE : 2000 $` : "SÉCURISER LES FONDS"}
                   </button>
                 )}
               </div>

               {/* 3. TOTAL ACCEPTÉ (Nouveau !) */}
               <div style={{ 
                   background: 'rgba(16, 185, 129, 0.1)', 
                   border: '1px solid rgba(16, 185, 129, 0.3)', 
                   padding: '15px', borderRadius: '4px',
                   display: 'flex', justifyContent: 'space-between', alignItems: 'center'
               }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                       <ShieldCheck size={20} color="#10b981"/>
                       <span style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 'bold' }}>FONDS SÉCURISÉS</span>
                   </div>
                   <span style={{ fontFamily: 'Rajdhani', fontSize: '1.4rem', fontWeight: 'bold', color: '#fff' }}>
                       {user.economy.gagneTotal || 0} $
                   </span>
               </div>
            </div>
        </div>
      </div>

      {/* --- SECTION BASSE : NOUVEAUX FORMULAIRES --- */}
      <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #1e293b' }}>
         <h3 className="tech-font" style={{ marginBottom: '2rem', fontSize: '1.4rem', color: 'var(--text-main)' }}>
            /// DOSSIERS CLASSIFIÉS & FORMULAIRES SPÉCIAUX
         </h3>

         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
             
             {/* CARTE 1 */}
             <div className="pro-card" style={{ borderColor: 'var(--primary)', cursor: 'pointer', transition: '0.3s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <FileText size={24} color="var(--primary)"/>
                    <span className="text-cyan">1500 $</span>
                </div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>RECENSEMENT ÉTENDU</h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Formulaire complet de 30 questions sur votre situation personnelle et vos habitudes.</p>
                <div style={{ marginTop: '15px' }}>
                    <button className="btn-secondary w-full">OUVRIR LE DOSSIER</button>
                </div>
             </div>

             {/* CARTE 2 */}
             <div className="pro-card" style={{ borderColor: 'var(--warning)', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <Lock size={24} color="var(--warning)"/>
                    <span className="text-warning">2500 $</span>
                </div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>PROTOCOLE DE SÉCURITÉ</h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Test d'aptitude et de loyauté envers l'administration centrale. (45 Questions)</p>
                <div style={{ marginTop: '15px' }}>
                    <button className="btn-secondary w-full" style={{ borderColor: 'var(--warning)', color: 'var(--warning)' }}>ACCÈS RESTREINT</button>
                </div>
             </div>

             {/* CARTE 3 */}
             <div className="pro-card" style={{ borderColor: '#a855f7', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <ShieldCheck size={24} color="#a855f7"/>
                    <span style={{ color: '#a855f7', fontWeight: 'bold' }}>+500 CRÉDIT SOCIAL</span>
                </div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>DÉNONCIATION CIVIQUE</h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Signalez des comportements suspects dans votre secteur. Anonymat garanti.</p>
                <div style={{ marginTop: '15px' }}>
                    <button className="btn-secondary w-full" style={{ borderColor: '#a855f7', color: '#a855f7' }}>SIGNALER</button>
                </div>
             </div>

         </div>
      </div>

      {/* --- MODALES --- */}
      {modalInfo.open && <InfoModal title={modalInfo.title} msg={modalInfo.msg} onClose={() => setModalInfo({ ...modalInfo, open: false })} />}
      {isEditOpen && <EditProfileModal user={user} onClose={() => setIsEditOpen(false)} onSave={handleSaveProfile} />}
      
      {/* MODALE HISTORIQUE (Simple Wrapper) */}
      {isHistoryOpen && (
        <div className="overlay" onClick={() => setIsHistoryOpen(false)}>
            <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <h3 className="tech-font mb-4">HISTORIQUE DES TRANSACTIONS</h3>
                <div style={{ maxHeight: '400px', overflowY: 'auto', textAlign: 'left' }}>
                    <HistorySection history={history} />
                </div>
                <button className="btn-secondary w-full mt-4" onClick={() => setIsHistoryOpen(false)} style={{ marginTop: '20px' }}>FERMER</button>
            </div>
        </div>
      )}

    </div>
  );
}