import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, onSnapshot, updateDoc, addDoc, collection, arrayUnion } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { RANDOM_QUESTIONS } from '../data/questions';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [question, setQuestion] = useState(null);
  
  // États pour UI (Modale Edit, Modale Info)
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

  // LOGIQUE JEU
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
      updates["economy.enAttente"] = user.economy.enAttente + question.reward;
      updates["game.dailyCount"] = currentCount + 1;
      updates["game.lastQuestionDate"] = today;
    }
    // Sauvegarde toujours les réponses sensibles
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

  // LOGIQUE RETRAIT
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
      setInfoModal({ open: true, title: "VIREMENT INITIÉ", msg: "Demande transmise à l'administration. En attente de validation." });
    } catch (e) { console.error(e); }
  };

  const saveProfile = async () => {
    await updateDoc(doc(db, "users", auth.currentUser.uid), { info: editForm });
    setEditOpen(false);
  };

  if (!user) return <div className="flex-center">Chargement BNI...</div>;
  const isWaiting = user.economy.statutRetrait === 'waiting';

  return (
    <div className="container">
      
      {/* HEADER UTILISATEUR */}
      <div className="pro-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <img src={user.info.avatar} style={{ width: '70px', height: '70px', borderRadius: '50%', border: '2px solid var(--primary)', objectFit: 'cover' }} alt="Avatar" />
          <div>
            <h2 style={{ margin: 0 }}>{user.info.prenom} {user.info.nom}</h2>
            <button className="btn-secondary" style={{ padding: '2px 8px', fontSize: '0.7rem' }} onClick={() => setEditOpen(true)}>✎ MODIFIER PROFIL</button>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.8rem', color: 'var(--success)', fontFamily: 'Rajdhani', fontWeight: 'bold' }}>{user.economy.gagneTotal} $</div>
          <button className="btn-danger" style={{ fontSize: '0.7rem' }} onClick={() => { signOut(auth); navigate('/'); }}>DÉCONNEXION</button>
        </div>
      </div>

      <div className="grid-2">
        {/* CARTE JEU */}
        <div className="pro-card">
          <h3 className="text-cyan">ACTIVITÉ SALARIÉE</h3>
          <p className="text-muted">Répondez aux enquêtes d'entreprise.</p>
          <div style={{ margin: '1rem 0' }}>QUOTA : {user.game.lastQuestionDate === new Date().toLocaleDateString('fr-FR') ? user.game.dailyCount : 0} / 5</div>

          {!question ? (
            <button className="btn-main" onClick={pickQuestion}>LANCER TÂCHE (+50$)</button>
          ) : (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <p style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderLeft: '3px solid var(--primary)', marginBottom: '15px' }}>{question.text}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {question.options.map((opt, i) => (
                  <button key={i} className="btn-secondary" onClick={() => handleAnswer(opt)}>{opt}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CARTE BANQUE */}
        <div className="pro-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 className="text-cyan">PORTEFEUILLE TEMPORAIRE</h3>
          <div style={{ fontSize: '3.5rem', fontFamily: 'Rajdhani', fontWeight: 'bold', color: isWaiting ? 'var(--warning)' : 'white' }}>
            {isWaiting ? 0 : user.economy.enAttente} $
          </div>

          {isWaiting ? (
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', padding: '15px', borderRadius: '8px', border: '1px solid var(--warning)' }}>
              ⏳ TRAITEMENT EN COURS...
            </div>
          ) : (
            <button onClick={handleWithdraw} disabled={user.economy.enAttente < 2000} className="btn-main" style={{ marginTop: '20px' }}>
              {user.economy.enAttente < 2000 ? 'MINIMUM 2000$ REQUIS' : 'RÉCUPÉRER MON ARGENT'}
            </button>
          )}
        </div>
      </div>

      {/* --- MODALES PERSONNALISÉES --- */}

      {/* 1. Modal Info */}
      {infoModal.open && (
        <div className="overlay">
          <div className="modal-box">
            <h3 className="text-cyan">{infoModal.title}</h3>
            <p style={{ margin: '20px 0' }}>{infoModal.msg}</p>
            <button className="btn-main" onClick={() => setInfoModal({ ...infoModal, open: false })}>CONFIRMER</button>
          </div>
        </div>
      )}

      {/* 2. Modal Edition */}
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