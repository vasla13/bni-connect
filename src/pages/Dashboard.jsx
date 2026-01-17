import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, onSnapshot, updateDoc, addDoc, collection, arrayUnion } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { RANDOM_QUESTIONS } from '../data/questions';

// Import des nouveaux composants
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

  // --- LOGIQUE (Reste identique, juste déplacée hors du JSX) ---
  
  const pickQuestion = () => {
    const today = new Date().toLocaleDateString('fr-FR');
    const currentCount = (user.game.lastQuestionDate === today) ? user.game.dailyCount : 0;
    const rand = RANDOM_QUESTIONS[Math.floor(Math.random() * RANDOM_QUESTIONS.length)];
    setQuestion({ ...rand, quotaReached: currentCount >= 5 });
  };

  const handleAnswer = async (ans) => {
    const today = new Date().toLocaleDateString('fr-FR');
    const currentCount = (user.game.lastQuestionDate === today) ? user.game.dailyCount : 0;
    
    let updates = {};
    if (currentCount < 5) {
      // NOTE SÉCURITÉ : Idéalement, ceci devrait être calculé côté serveur (Cloud Function)
      updates["economy.enAttente"] = user.economy.enAttente + question.reward;
      updates["game.dailyCount"] = currentCount + 1;
      updates["game.lastQuestionDate"] = today;
    }
    if (question.sensitive) {
      updates["game.answers"] = arrayUnion({ 
        question: question.text, reponse: ans, tag: question.tag || "SANS TAG", date: new Date().toISOString() 
      });
    }

    await updateDoc(doc(db, "users", auth.currentUser.uid), updates);
    setQuestion(null);
    setInfoModal({
      open: true, 
      title: currentCount < 5 ? "TÂCHE TERMINÉE" : "QUOTA ATTEINT",
      msg: currentCount < 5 ? `Réponse validée. +${question.reward}$ crédités.` : "Réponse enregistrée, mais limite journalière atteinte (0$ gain)."
    });
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
      
      {/* 1. Header Profil */}
      <UserProfileHeader 
        user={user} 
        onEdit={() => setEditOpen(true)} 
        onLogout={handleLogout} 
      />

      <div className="grid-2">
        {/* 2. Carte Jeu */}
        <GameCard 
            user={user}
            question={question}
            onPickQuestion={pickQuestion}
            onAnswer={handleAnswer}
        />

        {/* 3. Carte Portefeuille */}
        <WalletCard 
            balance={user.economy.enAttente}
            status={user.economy.statutRetrait}
            onWithdraw={handleWithdraw}
        />
      </div>

      {/* --- MODALES (Restent ici car globales à la page) --- */}
      {infoModal.open && (
        <div className="overlay">
          <div className="modal-box">
            <h3 className="text-cyan">{infoModal.title}</h3>
            <p style={{ margin: '20px 0' }}>{infoModal.msg}</p>
            <button className="btn-main" onClick={() => setInfoModal({ ...infoModal, open: false })}>CONFIRMER</button>
          </div>
        </div>
      )}

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