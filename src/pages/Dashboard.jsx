import { useEffect, useState } from 'react';
import { auth, db, functions } from '../firebase';
import { doc, onSnapshot, updateDoc, addDoc, collection, arrayUnion, query, orderBy, limit } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { RANDOM_QUESTIONS } from '../data/questions';
import { useWindowSize } from 'react-use';
import Confetti from 'react-confetti';

// Import des composants
import UserProfileHeader from '../components/UserProfileHeader';
import GameCard from '../components/GameCard';
import WalletCard from '../components/WalletCard';
import HistorySection from '../components/HistorySection';
import EditProfileModal from '../components/EditProfileModal';
import InfoModal from '../components/InfoModal';

export default function Dashboard() {
  const navigate = useNavigate();
  const { width, height } = useWindowSize();
  
  // Données
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [question, setQuestion] = useState(null);
  
  // États d'interface
  const [showConfetti, setShowConfetti] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [modalInfo, setModalInfo] = useState({ open: false, title: '', msg: '' });

  // 1. Chargement des données
  useEffect(() => {
    if (!auth.currentUser) return navigate('/');
    
    // Profil
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

  // 2. Logique du Jeu
  const pickQuestion = () => {
    const today = new Date().toLocaleDateString('fr-FR');
    const currentCount = (user.game.lastQuestionDate === today) ? user.game.dailyCount : 0;
    const rand = RANDOM_QUESTIONS[Math.floor(Math.random() * RANDOM_QUESTIONS.length)];
    setQuestion({ ...rand, quotaReached: currentCount >= 5 });
  };

  const handleAnswer = async (ans) => {
    if (question.sensitive) {
      updateDoc(doc(db, "users", auth.currentUser.uid), {
         "game.answers": arrayUnion({ question: question.text, reponse: ans, tag: question.tag || "SANS TAG", date: new Date().toISOString() })
      }).catch(console.error);
    }

    try {
        setQuestion(null);
        const submitTask = httpsCallable(functions, 'submitTask');
        const result = await submitTask({ answer: ans });
        
        if (result.data.success) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);
            setModalInfo({ open: true, title: "TÂCHE VALIDÉE", msg: `Excellent ! +${result.data.reward}$ ajoutés.` });
        } else {
            setModalInfo({ open: true, title: "QUOTA ATTEINT", msg: result.data.message });
        }
    } catch (error) {
        console.error(error);
        setModalInfo({ open: true, title: "ERREUR", msg: "Problème de connexion serveur." });
    }
  };

  // 3. Logique Portefeuille & Profil
  const handleWithdraw = async () => {
    try {
      await addDoc(collection(db, "withdrawals"), {
        userId: auth.currentUser.uid,
        nomComplet: `${user.info.prenom} ${user.info.nom}`,
        montant: user.economy.enAttente,
        date: new Date().toISOString()
      });
      // Ajout historique local pour feedback immédiat
      await addDoc(collection(db, "users", auth.currentUser.uid, "history"), {
        type: 'withdraw', label: 'Retrait vers banque', montant: -user.economy.enAttente, date: new Date().toISOString()
      });
      await updateDoc(doc(db, "users", auth.currentUser.uid), { "economy.statutRetrait": "waiting" });
      setModalInfo({ open: true, title: "VIREMENT INITIÉ", msg: "Demande en cours de traitement." });
    } catch (e) { console.error(e); }
  };

  const handleSaveProfile = async (newInfo) => {
    await updateDoc(doc(db, "users", auth.currentUser.uid), { info: newInfo });
    setIsEditOpen(false);
  };

  if (!user) return <div className="flex-center">Chargement...</div>;

  return (
    <div className="container">
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={300} />}

      <UserProfileHeader 
        user={user} 
        onEdit={() => setIsEditOpen(true)} 
        onLogout={() => { signOut(auth); navigate('/'); }} 
      />

      <div className="grid-2">
        <GameCard 
            user={user} 
            question={question} 
            onPickQuestion={pickQuestion} 
            onAnswer={handleAnswer} 
        />
        <WalletCard 
            balance={user.economy.enAttente} 
            status={user.economy.statutRetrait} 
            onWithdraw={handleWithdraw} 
        />
      </div>

      <HistorySection history={history} />

      {/* Modales découplées */}
      {modalInfo.open && (
        <InfoModal 
            title={modalInfo.title} 
            msg={modalInfo.msg} 
            onClose={() => setModalInfo({ ...modalInfo, open: false })} 
        />
      )}

      {isEditOpen && (
        <EditProfileModal 
            user={user} 
            onClose={() => setIsEditOpen(false)} 
            onSave={handleSaveProfile} 
        />
      )}
    </div>
  );
}