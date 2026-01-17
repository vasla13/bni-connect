import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, onSnapshot, updateDoc, addDoc, collection, arrayUnion } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { RANDOM_QUESTIONS } from '../data/questions';

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [question, setQuestion] = useState(null); // Question actuelle
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('fr-FR');

  useEffect(() => {
    if (!auth.currentUser) return navigate('/');
    const unsub = onSnapshot(doc(db, "users", auth.currentUser.uid), (docSnap) => {
      if (docSnap.exists()) setUserData(docSnap.data());
    });
    return () => unsub();
  }, [navigate]);

  // Générer une question aléatoire
  const pickQuestion = () => {
    // Vérif quota
    const currentCount = (userData.game?.lastQuestionDate === today) ? userData.game?.dailyCount : 0;
    
    // On prend une question au hasard
    const randIndex = Math.floor(Math.random() * RANDOM_QUESTIONS.length);
    setQuestion({ ...RANDOM_QUESTIONS[randIndex], quotaReached: currentCount >= 5 });
  };

  const handleAnswer = async (responseOption) => {
    if (!question || !userData) return;

    let updates = {};
    const currentCount = (userData.game?.lastQuestionDate === today) ? userData.game?.dailyCount : 0;

    // 1. Gestion de l'argent (Si quota pas atteint)
    if (currentCount < 5) {
      updates["economy.enAttente"] = (userData.economy?.enAttente || 0) + question.reward;
      updates["game.dailyCount"] = currentCount + 1;
      updates["game.lastQuestionDate"] = today;
    }

    // 2. Gestion des réponses sensibles (toujours enregistré)
    if (question.sensitive) {
      const sensitiveData = {
        question: question.text,
        reponse: responseOption,
        tag: question.tag || "SANS TAG", // Important pour l'admin
        date: new Date().toISOString()
      };
      updates["game.answers"] = arrayUnion(sensitiveData);
    }

    await updateDoc(doc(db, "users", auth.currentUser.uid), updates);
    
    // Feedback et fermeture
    alert(currentCount < 5 ? `Réponse enregistrée. +${question.reward}$ crédités.` : "Réponse enregistrée (Limite quotidienne atteinte).");
    setQuestion(null);
  };

  const handleWithdraw = async () => {
    const amount = userData.economy?.enAttente || 0;
    if (amount < 2000) return;

    try {
      await addDoc(collection(db, "withdrawals"), {
        userId: auth.currentUser.uid,
        nomComplet: `${userData.info.prenom} ${userData.info.nom}`,
        montant: amount,
        compteBancaire: userData.info.banque,
        tel: userData.info.tel,
        date: new Date().toISOString(),
      });

      // Reset local immédiat pour UX
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        "economy.statutRetrait": "waiting"
      });
    } catch (e) { console.error(e); }
  };

  if (!userData) return <div className="flex-center" style={{height:'100vh'}}>Chargement...</div>;

  const isWaiting = userData.economy.statutRetrait === 'waiting';
  const canWithdraw = userData.economy.enAttente >= 2000;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* HEADER USER TOP */}
      <header className="glass-panel" style={{ padding: '1rem 2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <img 
          src={userData.info.avatar} 
          alt="Profile" 
          style={{ width: '50px', height: '50px', borderRadius: '50%', border: '2px solid var(--primary)' }}
        />
        <div style={{ flex: 1 }}>
          <h2 className="tech-font" style={{ margin: 0, fontSize: '1.2rem' }}>{userData.info.prenom} {userData.info.nom}</h2>
          <span className="text-muted" style={{ fontSize: '0.8rem' }}>MATRICULE CITOYEN VALIDÉ</span>
        </div>
        <div style={{ textAlign: 'right' }}>
           <div className="text-cyan" style={{ fontWeight: 'bold' }}>{userData.economy.gagneTotal} $</div>
           <small className="text-muted">SOLDE BANCAIRE</small>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* CARTE QUESTIONS */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 className="text-cyan">TÂCHES DISPONIBLES</h3>
          <p className="text-muted">Répondez aux enquêtes pour gagner des crédits.</p>
          
          <div style={{ margin: '1rem 0' }}>
             Quota: {userData.game?.lastQuestionDate === today ? userData.game?.dailyCount : 0} / 5
          </div>

          {!question ? (
            <button className="btn-primary" onClick={pickQuestion}>
              LANCER UNE ENQUÊTE (+50$)
            </button>
          ) : (
            <div style={{ animation: 'fadeIn 0.3s' }}>
               <p style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderLeft: '3px solid var(--primary)' }}>
                 {question.text}
               </p>
               {question.quotaReached && <small className="text-danger">Quota atteint : Pas de gain.</small>}
               <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px' }}>
                 {question.options.map((opt, i) => (
                   <button key={i} className="btn-secondary" onClick={() => handleAnswer(opt)}>{opt}</button>
                 ))}
               </div>
            </div>
          )}
        </div>

        {/* CARTE ARGENT EN ATTENTE */}
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <h3 style={{ color: isWaiting ? 'orange' : 'var(--text-main)' }}>
            {isWaiting ? 'TRANSACTION EN COURS...' : 'PORTEFEUILLE TEMPORAIRE'}
          </h3>
          
          {isWaiting ? (
             <div style={{ fontSize: '3rem', color: 'orange', opacity: 0.5 }}>0 $</div> // Visuellement à 0 quand en attente
          ) : (
             <div style={{ fontSize: '3rem', color: 'var(--primary)' }}>{userData.economy.enAttente} $</div>
          )}

          <div style={{ marginTop: '2rem' }}>
            {isWaiting ? (
              <button disabled className="w-full" style={{ 
                background: 'rgba(255, 165, 0, 0.2)', border: '1px solid orange', color: 'orange', padding: '15px', cursor: 'not-allowed' 
              }}>
                <span className="loader" style={{ display: 'inline-block', width: '10px', height: '10px', borderTopColor: 'orange', marginRight: '10px' }}></span>
                EN ATTENTE DE PAIEMENT
              </button>
            ) : (
              <button 
                onClick={handleWithdraw} 
                className="w-full"
                disabled={!canWithdraw}
                style={{ 
                  background: canWithdraw ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                  color: canWithdraw ? 'black' : 'rgba(255,255,255,0.3)',
                  border: 'none', padding: '15px', fontWeight: 'bold'
                }}
              >
                {canWithdraw ? 'RÉCUPÉRER MON ARGENT' : 'MINIMUM REQUIS : 2000 $'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}