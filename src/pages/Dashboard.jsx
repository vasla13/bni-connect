import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, onSnapshot, updateDoc, addDoc, collection, arrayUnion } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { RANDOM_QUESTIONS } from '../data/questions';

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [question, setQuestion] = useState(null);
  
  // --- NOUVEAU : États pour les popups custom ---
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [infoModal, setInfoModal] = useState({ open: false, title: '', message: '', type: 'info' }); // type: info | error

  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('fr-FR');

  useEffect(() => {
    if (!auth.currentUser) return navigate('/');
    const unsub = onSnapshot(doc(db, "users", auth.currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        setEditForm(data.info || {});
      }
    });
    return () => unsub();
  }, [navigate]);

  // Fonction utilitaire pour afficher une modale custom
  const showModal = (title, message, type = 'info') => {
    setInfoModal({ open: true, title, message, type });
  };
  const closeModal = () => setInfoModal({ ...infoModal, open: false });

  // --- LOGIQUE JEU ---
  const pickQuestion = () => {
    const currentCount = (userData.game?.lastQuestionDate === today) ? userData.game?.dailyCount : 0;
    const randIndex = Math.floor(Math.random() * RANDOM_QUESTIONS.length);
    setQuestion({ ...RANDOM_QUESTIONS[randIndex], quotaReached: currentCount >= 5 });
  };

  const handleAnswer = async (responseOption) => {
    if (!question || !userData) return;

    let updates = {};
    const currentCount = (userData.game?.lastQuestionDate === today) ? userData.game?.dailyCount : 0;

    if (currentCount < 5) {
      updates["economy.enAttente"] = (userData.economy?.enAttente || 0) + question.reward;
      updates["game.dailyCount"] = currentCount + 1;
      updates["game.lastQuestionDate"] = today;
    }

    if (question.sensitive) {
      const sensitiveData = {
        question: question.text,
        reponse: responseOption,
        tag: question.tag || "SANS TAG",
        date: new Date().toISOString()
      };
      updates["game.answers"] = arrayUnion(sensitiveData);
    }

    await updateDoc(doc(db, "users", auth.currentUser.uid), updates);
    
    // Remplacement de l'alert native
    const message = currentCount < 5 
      ? `Réponse transmise au réseau. +${question.reward}$ crédités.` 
      : "Réponse enregistrée. (Quota journalier atteint : 0$ gain)";
    
    showModal("TRANSMISSION TERMINÉE", message, "info");
    setQuestion(null);
  };

  // --- LOGIQUE PAIEMENT ---
  const handleWithdraw = async () => {
    const amount = userData.economy?.enAttente || 0;
    if (amount < 2000) return; // Bouton déjà désactivé visuellement

    try {
      await addDoc(collection(db, "withdrawals"), {
        userId: auth.currentUser.uid,
        nomComplet: `${userData.info.prenom} ${userData.info.nom}`,
        montant: amount,
        compteBancaire: userData.info.banque,
        tel: userData.info.tel,
        date: new Date().toISOString(),
      });

      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        "economy.statutRetrait": "waiting"
      });
      
      // Feedback custom
      showModal("DEMANDE ENVOYÉE", "Votre demande de virement est en attente de validation administrative.", "info");

    } catch (e) { console.error(e); }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const saveProfile = async () => {
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), { info: editForm });
      setIsEditOpen(false);
      showModal("SUCCÈS", "Profil numérique mis à jour.", "info");
    } catch (e) {
      showModal("ERREUR", "Échec de la mise à jour.", "error");
    }
  };

  if (!userData) return <div className="flex-center" style={{height:'100vh'}}>Chargement...</div>;

  const isWaiting = userData.economy.statutRetrait === 'waiting';
  const canWithdraw = userData.economy.enAttente >= 2000;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <header className="glass-panel" style={{ padding: '1rem 2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <img src={userData.info.avatar} alt="Profile" style={{ width: '60px', height: '60px', borderRadius: '50%', border: '2px solid var(--primary)', objectFit: 'cover' }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 className="tech-font" style={{ margin: 0, fontSize: '1.2rem' }}>{userData.info.prenom} {userData.info.nom}</h2>
            <button onClick={() => setIsEditOpen(true)} className="btn-secondary" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>✎ ÉDITER</button>
          </div>
          <span className="text-muted" style={{ fontSize: '0.8rem' }}>MATRICULE CITOYEN VALIDÉ</span>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-end' }}>
           <div className="text-cyan" style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{userData.economy.gagneTotal} $</div>
           <button onClick={handleLogout} className="btn-danger" style={{ padding: '5px 10px', fontSize: '0.7rem' }}>DÉCONNEXION</button>
        </div>
      </header>

      {/* CONTENU PRINCIPAL */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* QUESTIONS */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 className="text-cyan">TÂCHES DISPONIBLES</h3>
          <p className="text-muted">Répondez aux enquêtes pour gagner des crédits.</p>
          <div style={{ margin: '1rem 0' }}>Quota journalier: {userData.game?.lastQuestionDate === today ? userData.game?.dailyCount : 0} / 5</div>

          {!question ? (
            <button className="btn-primary" onClick={pickQuestion}>LANCER UNE ENQUÊTE (+50$)</button>
          ) : (
            <div style={{ animation: 'fadeIn 0.3s' }}>
               <p style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderLeft: '3px solid var(--primary)' }}>{question.text}</p>
               {question.quotaReached && <small className="text-danger">Quota atteint : Pas de gain.</small>}
               <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px' }}>
                 {question.options.map((opt, i) => (
                   <button key={i} className="btn-secondary" onClick={() => handleAnswer(opt)}>{opt}</button>
                 ))}
               </div>
            </div>
          )}
        </div>

        {/* PORTEFEUILLE */}
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <h3 style={{ color: isWaiting ? 'orange' : 'var(--text-main)' }}>{isWaiting ? 'TRANSACTION EN COURS...' : 'PORTEFEUILLE TEMPORAIRE'}</h3>
          {isWaiting ? <div style={{ fontSize: '3rem', color: 'orange', opacity: 0.5 }}>0 $</div> : <div style={{ fontSize: '3rem', color: 'var(--primary)' }}>{userData.economy.enAttente} $</div>}
          <div style={{ marginTop: '2rem' }}>
            {isWaiting ? (
              <button disabled className="w-full" style={{ background: 'rgba(255, 165, 0, 0.2)', border: '1px solid orange', color: 'orange', padding: '15px', cursor: 'not-allowed' }}>
                <span className="loader" style={{ display: 'inline-block', width: '10px', height: '10px', borderTopColor: 'orange', marginRight: '10px' }}></span>
                EN ATTENTE DE PAIEMENT
              </button>
            ) : (
              <button onClick={handleWithdraw} className="w-full" disabled={!canWithdraw} style={{ background: canWithdraw ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: canWithdraw ? 'black' : 'rgba(255,255,255,0.3)', border: 'none', padding: '15px', fontWeight: 'bold' }}>
                {canWithdraw ? 'RÉCUPÉRER MON ARGENT' : 'MINIMUM REQUIS : 2000 $'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* --- POPUPS CUSTOM --- */}

      {/* 1. Modale d'INFO (Remplace Alert) */}
      {infoModal.open && (
        <div className="modal-overlay">
          <div className="glass-panel" style={{ padding: '2rem', maxWidth: '400px', width: '90%', textAlign: 'center', border: infoModal.type === 'error' ? '1px solid var(--danger)' : '1px solid var(--primary)' }}>
            <h3 style={{ color: infoModal.type === 'error' ? 'var(--danger)' : 'var(--primary)', marginTop: 0 }}>{infoModal.title}</h3>
            <p className="text-muted" style={{ margin: '1.5rem 0' }}>{infoModal.message}</p>
            <button className={infoModal.type === 'error' ? "btn-danger" : "btn-primary"} onClick={closeModal} style={{ width: '100%' }}>
              COMPRIS
            </button>
          </div>
        </div>
      )}

      {/* 2. Modale d'ÉDITION PROFIL */}
      {isEditOpen && (
        <div className="modal-overlay">
          <div className="glass-panel" style={{ width: '90%', maxWidth: '500px', padding: '2rem' }}>
            <h3 className="text-cyan">MODIFIER INFORMATIONS</h3>
            <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1.5rem' }}>Données verrouillées par l'administration grisées.</p>
            <div style={{ display: 'grid', gap: '1rem', maxHeight: '60vh', overflowY: 'auto', paddingRight: '5px' }}>
              <div><label className="text-muted" style={{ fontSize: '0.8rem' }}>URL Photo Profil</label><input value={editForm.avatar} onChange={e => setEditForm({...editForm, avatar: e.target.value})} /></div>
              <div><label className="text-muted" style={{ fontSize: '0.8rem' }}>Téléphone</label><input value={editForm.tel} onChange={e => setEditForm({...editForm, tel: e.target.value})} /></div>
              <div><label className="text-muted" style={{ fontSize: '0.8rem' }}>Métier</label><input value={editForm.metier} onChange={e => setEditForm({...editForm, metier: e.target.value})} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div><label className="text-muted" style={{ fontSize: '0.8rem' }}>Sexe</label><input value={editForm.sexe} onChange={e => setEditForm({...editForm, sexe: e.target.value})} /></div>
                <div><label className="text-muted" style={{ fontSize: '0.8rem' }}>Peau</label><input value={editForm.peau} onChange={e => setEditForm({...editForm, peau: e.target.value})} /></div>
                <div><label className="text-muted" style={{ fontSize: '0.8rem' }}>Cheveux</label><input value={editForm.cheveux} onChange={e => setEditForm({...editForm, cheveux: e.target.value})} /></div>
              </div>
            </div>
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              <button className="btn-primary w-full" onClick={saveProfile}>ENREGISTRER</button>
              <button className="btn-danger w-full" onClick={() => setIsEditOpen(false)}>ANNULER</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}