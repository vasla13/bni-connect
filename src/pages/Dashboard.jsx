import { useEffect, useState, useMemo } from 'react';
import { auth, db, functions } from '../firebase';
import { doc, onSnapshot, updateDoc, collection, query, orderBy, limit, addDoc, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';

// IMPORTS COMPOSANTS
import UserProfileHeader from '../components/UserProfileHeader';
import HistorySection from '../components/HistorySection';
import InfoModal from '../components/InfoModal';
import EditProfileModal from '../components/EditProfileModal';
import FormRunnerModal from '../components/FormRunnerModal';

// IMPORTS DASHBOARD (Sous-composants)
import TaskFeed from '../components/dashboard/TaskFeed';
import WalletPanel from '../components/dashboard/WalletPanel';
import FormsList from '../components/dashboard/FormsList';

export default function Dashboard() {
  const navigate = useNavigate();
  
  // --- ÉTATS ---
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [questionQueue, setQuestionQueue] = useState([]); // Tâches rapides
  const [forms, setForms] = useState([]); // Formulaires longs
  
  // États Modales
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [modalInfo, setModalInfo] = useState({ open: false, title: '', msg: '' });

  // --- 1. CHARGEMENT DONNÉES UTILISATEUR & SYSTÈME ---
  useEffect(() => {
    if (!auth.currentUser) return navigate('/');
    
    const uid = auth.currentUser.uid;

    // A. Profil Utilisateur
    const unsubUser = onSnapshot(doc(db, "users", uid), (doc) => {
        if (doc.exists()) setUser(doc.data());
    });
    
    // B. Historique (Derniers mouvements)
    const qHistory = query(collection(db, "users", uid, "history"), orderBy("date", "desc"), limit(10));
    const unsubHistory = onSnapshot(qHistory, (snap) => {
        setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // C. Virements en attente (Pour le panneau Finance)
    const qWithdrawals = query(collection(db, "withdrawals"), where("userId", "==", uid), where("statut", "==", "pending"));
    const unsubWithdrawals = onSnapshot(qWithdrawals, (snap) => {
        setPendingWithdrawals(snap.docs.map(d => d.data()));
    });

    // D. Formulaires Disponibles (Dossiers Spéciaux)
    const qForms = query(collection(db, "forms")); 
    const unsubForms = onSnapshot(qForms, (snap) => {
        setForms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubUser(); unsubHistory(); unsubWithdrawals(); unsubForms(); };
  }, [navigate]);

  // Calcul du montant total en attente de paiement
  const totalPendingAmount = useMemo(() => {
    return pendingWithdrawals.reduce((acc, curr) => acc + (curr.montant || 0), 0);
  }, [pendingWithdrawals]);

  // --- 2. LOGIQUE TÂCHES RAPIDES (DYNAMIQUE) ---
  useEffect(() => {
    // Si la file d'attente est vide, on va chercher de nouvelles tâches en base de données
    if (questionQueue.length === 0) {
       const qTasks = collection(db, "rapid_tasks");
       
       const unsubTasks = onSnapshot(qTasks, (snapshot) => {
           const dbTasks = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
           
           if (dbTasks.length > 0) {
               // On mélange et on en prend 5 au hasard
               const shuffled = dbTasks.sort(() => 0.5 - Math.random()).slice(0, 5);
               // On ajoute un ID unique local pour éviter les clés dupliquées React
               setQuestionQueue(shuffled.map((t, i) => ({ ...t, uniqueId: Date.now() + i })));
           } else {
               // Fallback si aucune tâche n'est créée par l'admin
               // Note: reward 0 ici, et le serveur validera 0 car pas d'ID en DB
               setQuestionQueue([{ 
                   text: "En attente d'ordres du commandement...", 
                   reward: 0, 
                   uniqueId: Date.now(), 
                   type: 'text' 
               }]);
           }
       });
       
       return () => unsubTasks();
    }
  }, [questionQueue.length]);

  // --- ACTIONS ---
  
  // Répondre à une Tâche Rapide
  const handleAnswerTask = async (ans, currentQuestion) => {
    // On retire la question de la file locale immédiatement (optimiste)
    setQuestionQueue(prev => prev.slice(1));
    
    try {
        const submitTask = httpsCallable(functions, 'submitTask');
        // UPDATE DE SÉCURITÉ : On envoie l'ID (currentQuestion.id est l'ID Firestore)
        // Le serveur ignorera 'currentQuestion' s'il est envoyé, mais on garde propre.
        const result = await submitTask({ 
          answer: ans, 
          questionId: currentQuestion.id 
        });
        
        if (!result.data.success) {
            setModalInfo({ open: true, title: "ALERTE", msg: result.data.message });
        }
    } catch (error) { 
        console.error(error); 
        // Gestion d'erreur visuelle si nécessaire
    }
  };

  // Demander un virement
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
      // Mise à jour locale (optimiste) en attendant la cloud function
      await updateDoc(doc(db, "users", auth.currentUser.uid), { 
          "economy.statutRetrait": "waiting", 
          "economy.enAttente": 0 
      });
      setModalInfo({ open: true, title: "TRANSMISSION", msg: "Demande de virement transmise à l'administration." });
    } catch (e) { console.error(e); }
  };

  if (!user) return <div className="flex-center tech-font">CONNEXION AU RÉSEAU...</div>;

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}> 
      
      {/* HEADER PROFIL */}
      <UserProfileHeader 
        user={user} 
        onEdit={() => setIsEditOpen(true)}
        onShowHistory={() => setIsHistoryOpen(true)}
        onLogout={() => { signOut(auth); navigate('/'); }} 
      />

      {/* CONTENU PRINCIPAL (2 COLONNES) */}
      <div className="grid-2" style={{ alignItems: 'start', marginTop: '2rem' }}>
        
        {/* GAUCHE : FLUX DE TÂCHES */}
        <TaskFeed 
            user={user} 
            queue={questionQueue} 
            onAnswer={handleAnswerTask} 
        />
        
        {/* DROITE : FINANCE */}
        <WalletPanel 
            user={user} 
            pendingAmount={totalPendingAmount} 
            onWithdraw={handleWithdraw} 
        />
      </div>

      {/* LISTE DES DOSSIERS SPÉCIAUX */}
      <FormsList 
          forms={forms} 
          user={user} 
          onSelect={setSelectedForm} 
      />

      {/* --- MODALES --- */}
      
      {/* 1. Info / Alertes */}
      {modalInfo.open && (
          <InfoModal 
              title={modalInfo.title} 
              msg={modalInfo.msg} 
              onClose={() => setModalInfo({ ...modalInfo, open: false })} 
          />
      )}

      {/* 2. Édition Profil */}
      {isEditOpen && (
          <EditProfileModal 
              user={user} 
              onClose={() => setIsEditOpen(false)} 
              onSave={async (info) => { 
                  await updateDoc(doc(db, "users", auth.currentUser.uid), { info }); 
                  setIsEditOpen(false); 
              }} 
          />
      )}
      
      {/* 3. Historique */}
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

      {/* 4. Form Runner (Jeu Dossier) */}
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