import { useEffect, useState } from 'react';
import { auth, db, functions } from '../firebase'; // Assurez-vous d'avoir ajouté 'functions' dans firebase.js
import { doc, onSnapshot, updateDoc, addDoc, collection, arrayUnion } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions'; // Import pour la Cloud Function
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { RANDOM_QUESTIONS } from '../data/questions';

// Import des composants (assurez-vous de les avoir créés comme vu précédemment)
import UserProfileHeader from '../components/UserProfileHeader';
import GameCard from '../components/GameCard';
import WalletCard from '../components/WalletCard';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [question, setQuestion] = useState(null);
  
  // États UI
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [infoModal, setInfoModal] = useState({ open: false, title: '', msg: '' });

  // Écoute du profil utilisateur en temps réel
  useEffect(() => {
    if (!auth.currentUser) return navigate('/');
    const unsub = onSnapshot(doc(db, "users", auth.currentUser.uid), (doc) => {
      if (doc.exists()) {
        setUser(doc.data());
        setEditForm(doc.data().info || {});
      }
    });
    return () => unsub();
  }, [navigate]);

  // --- LOGIQUE MÉTIER ---

  const pickQuestion = () => {
    const today = new Date().toLocaleDateString('fr-FR');
    const currentCount = (user.game.lastQuestionDate === today) ? user.game.dailyCount : 0;
    const rand = RANDOM_QUESTIONS[Math.floor(Math.random() * RANDOM_QUESTIONS.length)];
    setQuestion({ ...rand, quotaReached: currentCount >= 5 });
  };

  const handleAnswer = async (ans) => {
    // 1. Sauvegarde locale des réponses (Analytique / Sondage) - Reste côté client
    if (question.sensitive) {
      try {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
           "game.answers": arrayUnion({ 
             question: question.text, reponse: ans, tag: question.tag || "SANS TAG", date: new Date().toISOString() 
           })
        });
      } catch (e) { console.error("Erreur sauvegarde réponse", e); }
    }

    // 2. VALIDATION ET PAIEMENT SÉCURISÉ (Via Cloud Function)
    try {
        setQuestion(null); // Fermeture immédiate de la question pour l'UX
        
        // Appel à la fonction serveur 'submitTask'
        const submitTask = httpsCallable(functions, 'submitTask');
        
        // On attend la réponse sécurisée du serveur
        const result = await submitTask({ answer: ans });
        const data = result.data;

        if (data.success) {
            setInfoModal({
                open: true,
                title: "TÂCHE TERMINÉE",
                msg: `Réponse validée par le serveur. +${data.reward}$ crédités.`
            });
        } else {
            setInfoModal({
                open: true,
                title: "QUOTA ATTEINT",
                msg: data.message || "Vous avez atteint votre limite journalière."
            });
        }

    } catch (error) {
        console.error("Erreur Cloud Function:", error);
        setInfoModal({
            open: true,
            title: "ERREUR",
            msg: "Une erreur est survenue lors de la validation serveur. Vérifiez votre connexion."
        });
    }
  };

  const handleWithdraw = async () => {
    if (user.economy.enAttente < 2000) return;
    try {
      await addDoc(collection(db, "withdrawals"), {
        userId: auth.currentUser.uid,
        nomComplet: `${user.info.prenom} ${user.info.nom}`,
        montant: user.economy.enAttente,
        compteBancaire: user.info.banque,
        tel: user.info.tel,
        date: new Date().toISOString()
      });
      await updateDoc(doc(db, "users", auth.currentUser.uid), { "economy.statutRetrait": "waiting" });
      setInfoModal({ open: true, title: "VIREMENT INITIÉ", msg: "Demande transmise à l'administration." });
    } catch (e) { console.error(e); }
  };

  const saveProfile = async () => {
    await updateDoc(doc(db, "users", auth.currentUser.uid), { info: editForm });
    setEditOpen(false);
  };

  const handleLogout = () => {
    signOut(auth);
    navigate('/');
  };

  if (!user) return <div className="flex-center">Chargement BNI...</div>;

  return (
    <div className="container">
      
      {/* 1. Header Profil (Inclut le Logo) */}
      <UserProfileHeader 
        user={user} 
        onEdit={() => setEditOpen(true)} 
        onLogout={handleLogout} 
      />

      <div className="grid-2">
        {/* 2. Carte Jeu (Quiz) */}
        <GameCard 
            user={user}
            question={question}
            onPickQuestion={pickQuestion}
            onAnswer={handleAnswer}
        />

        {/* 3. Carte Portefeuille (Retraits) */}
        <WalletCard 
            balance={user.economy.enAttente}
            status={user.economy.statutRetrait}
            onWithdraw={handleWithdraw}
        />
      </div>

      {/* --- MODALES --- */}
      
      {/* Modal d'information */}
      {infoModal.open && (
        <div className="overlay">
          <div className="modal-box">
            <h3 className="text-cyan">{infoModal.title}</h3>
            <p style={{ margin: '20px 0' }}>{infoModal.msg}</p>
            <button className="btn-main" onClick={() => setInfoModal({ ...infoModal, open: false })}>CONFIRMER</button>
          </div>
        </div>
      )}

      {/* Modal d'édition de profil */}
      {editOpen && (
        <div className="overlay">
          <div className="modal-box" style={{ textAlign: 'left' }}>
            <h3 className="text-cyan" style={{ textAlign: 'center' }}>MISE À JOUR DONNÉES</h3>
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <div className="input-group"><label>Avatar (URL)</label><input value={editForm.avatar} onChange={e => setEditForm({...editForm, avatar: e.target.value})} /></div>
              <div className="input-group"><label>Téléphone</label><input value={editForm.tel} onChange={e => setEditForm({...editForm, tel: e.target.value})} /></div>
              <div className="input-group"><label>Métier</label><input value={editForm.metier} onChange={e => setEditForm({...editForm, metier: e.target.value})} /></div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn-main" onClick={saveProfile}>SAUVEGARDER</button>
              <button className="btn-danger" onClick={() => setEditOpen(false)}>ANNULER</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}