import { useEffect, useState, useMemo } from 'react';
import { auth, db, functions } from '../firebase';
import { doc, onSnapshot, updateDoc, collection, query, orderBy, limit, addDoc, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { getQuestionPool } from '../data/questions'; 

// IMPORTS COMPOSANTS
import UserProfileHeader from '../components/UserProfileHeader';
import HistorySection from '../components/HistorySection';
import InfoModal from '../components/InfoModal';
import EditProfileModal from '../components/EditProfileModal';
import FormRunnerModal from '../components/FormRunnerModal';

// NOUVEAUX IMPORTS (Dossier Dashboard)
import TaskFeed from '../components/dashboard/TaskFeed';
import WalletPanel from '../components/dashboard/WalletPanel';
import FormsList from '../components/dashboard/FormsList';

export default function Dashboard() {
  const navigate = useNavigate();
  
  // --- ETATS ---
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [questionQueue, setQuestionQueue] = useState([]);
  const [forms, setForms] = useState([]); 
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [modalInfo, setModalInfo] = useState({ open: false, title: '', msg: '' });

  // --- 1. CHARGEMENT DONNÉES ---
  useEffect(() => {
    if (!auth.currentUser) return navigate('/');
    
    // User, History, Withdrawals, Forms
    const unsubUser = onSnapshot(doc(db, "users", auth.currentUser.uid), (doc) => doc.exists() && setUser(doc.data()));
    
    const qHistory = query(collection(db, "users", auth.currentUser.uid, "history"), orderBy("date", "desc"), limit(10));
    const unsubHistory = onSnapshot(qHistory, (snap) => setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    const qWithdrawals = query(collection(db, "withdrawals"), where("userId", "==", auth.currentUser.uid), where("statut", "==", "pending"));
    const unsubWithdrawals = onSnapshot(qWithdrawals, (snap) => setPendingWithdrawals(snap.docs.map(d => d.data())));

    const qForms = query(collection(db, "forms")); 
    const unsubForms = onSnapshot(qForms, (snap) => setForms(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsubUser(); unsubHistory(); unsubWithdrawals(); unsubForms(); };
  }, [navigate]);

  const totalPendingAmount = useMemo(() => pendingWithdrawals.reduce((acc, curr) => acc + (curr.montant || 0), 0), [pendingWithdrawals]);

  // --- 2. LOGIQUE TÂCHES RAPIDES ---
  useEffect(() => {
    if (questionQueue.length === 0) {
      const fullPool = getQuestionPool();
      setQuestionQueue(Array.from({ length: 5 }).map((_, i) => ({ 
        ...fullPool[Math.floor(Math.random() * fullPool.length)], 
        uniqueId: Date.now() + i 
      })));
    }
  }, [questionQueue.length]);

  // --- ACTIONS ---
  const handleAnswerTask = async (ans, currentQuestion) => {
    setQuestionQueue(prev => prev.slice(1));
    try {
        const submitTask = httpsCallable(functions, 'submitTask');
        const result = await submitTask({ answer: ans, questionData: currentQuestion });
        if (!result.data.success) setModalInfo({ open: true, title: "QUOTA ATTEINT", msg: result.data.message });
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
      await updateDoc(doc(db, "users", auth.currentUser.uid), { "economy.statutRetrait": "waiting", "economy.enAttente": 0 });
      setModalInfo({ open: true, title: "TRANSMISSION", msg: "Demande transmise." });
    } catch (e) { console.error(e); }
  };

  if (!user) return <div className="flex-center tech-font">CONNEXION AU RÉSEAU...</div>;

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}> 
      
      {/* HEADER */}
      <UserProfileHeader 
        user={user} 
        onEdit={() => setIsEditOpen(true)}
        onShowHistory={() => setIsHistoryOpen(true)}
        onLogout={() => { signOut(auth); navigate('/'); }} 
      />

      {/* CONTENU PRINCIPAL (2 COLONNES) */}
      <div className="grid-2" style={{ alignItems: 'start', marginTop: '2rem' }}>
        <TaskFeed 
            user={user} 
            queue={questionQueue} 
            onAnswer={handleAnswerTask} 
        />
        <WalletPanel 
            user={user} 
            pendingAmount={totalPendingAmount} 
            onWithdraw={handleWithdraw} 
        />
      </div>

      {/* LISTE DES FORMULAIRES (AVEC CORRECTIF) */}
      <FormsList 
          forms={forms} 
          user={user} 
          onSelect={setSelectedForm} 
      />

      {/* MODALES */}
      {modalInfo.open && <InfoModal title={modalInfo.title} msg={modalInfo.msg} onClose={() => setModalInfo({ ...modalInfo, open: false })} />}
      {isEditOpen && <EditProfileModal user={user} onClose={() => setIsEditOpen(false)} onSave={async (info) => { await updateDoc(doc(db, "users", auth.currentUser.uid), { info }); setIsEditOpen(false); }} />}
      
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

      {selectedForm && (
          <FormRunnerModal 
              form={selectedForm}
              user={user}
              onClose={() => setSelectedForm(null)}
          />
      )}
    </div>
  );
}