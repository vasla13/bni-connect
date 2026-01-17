import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, onSnapshot, updateDoc, addDoc, collection } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('fr-FR');

  useEffect(() => {
    if (!auth.currentUser) return navigate('/');
    
    // Écoute en temps réel des données
    const unsub = onSnapshot(doc(db, "users", auth.currentUser.uid), (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
        setEditForm(doc.data().info);
      }
    });
    return () => unsub();
  }, [navigate]);

  const handleLogout = () => {
    signOut(auth);
    navigate('/');
  };

  const handleFarm = async () => {
    if (!userData) return;

    // Reset du compteur journalier si la date a changé
    let currentCount = userData.game?.dailyCount || 0;
    const lastDate = userData.game?.lastQuestionDate || '';

    if (lastDate !== today) {
      currentCount = 0;
    }

    if (currentCount >= 5) {
      alert("Quota journalier atteint. Revenez demain pour plus de crédits.");
      return;
    }

    // Mise à jour
    const newAmount = (userData.economy?.enAttente || 0) + 50;
    
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      "economy.enAttente": newAmount,
      "game.dailyCount": currentCount + 1,
      "game.lastQuestionDate": today
    });
  };

  const handleWithdraw = async () => {
    const amount = userData.economy?.enAttente || 0;
    if (amount < 2000) return alert("Fonds insuffisants. Minimum requis: 2000 $.");
    if (userData.economy.statutRetrait === 'waiting') return alert("Une transaction est déjà en cours de validation.");

    try {
      // Création de la demande de virement
      await addDoc(collection(db, "withdrawals"), {
        userId: auth.currentUser.uid,
        nomComplet: `${userData.info.prenom} ${userData.info.nom}`,
        montant: amount,
        compteBancaire: userData.info.banque,
        date: new Date().toISOString(),
        status: 'pending'
      });

      // Update statut utilisateur
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        "economy.statutRetrait": "waiting"
      });

      alert("Demande de transfert envoyée au réseau bancaire.");
    } catch (e) {
      console.error(e);
      alert("Erreur réseau lors du transfert.");
    }
  };

  const saveProfile = async () => {
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      info: editForm
    });
    setModalOpen(false);
  };

  if (!userData) return <div className="flex-center" style={{height:'100vh'}}><div className="loader"></div></div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <header className="glass-panel" style={{ padding: '1rem 2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-cyan" style={{ margin: 0, fontSize: '1.5rem' }}>INTERFACE NEURO-FINANCIÈRE</h1>
          <span className="text-muted" style={{ fontSize: '0.8rem' }}>CONNECTÉ EN TANT QUE : {userData.info.prenom.toUpperCase()} {userData.info.nom.toUpperCase()}</span>
        </div>
        <button className="btn-danger" style={{ fontSize: '0.8rem', padding: '8px 16px' }} onClick={handleLogout}>
          DÉCONNEXION
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        
        {/* Carte Identité */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
            <img 
              src={userData.info.avatar} 
              alt="Avatar" 
              style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid var(--primary)', marginRight: '1rem', objectFit: 'cover' }} 
            />
            <div>
              <h3 style={{ margin: 0 }}>{userData.info.prenom} {userData.info.nom}</h3>
              <p className="text-cyan" style={{ margin: '5px 0' }}>{userData.info.metier}</p>
              <button className="btn-secondary" style={{ fontSize: '0.7rem', padding: '5px 10px' }} onClick={() => setModalOpen(true)}>
                ÉDITER PROFIL
              </button>
            </div>
          </div>
          
          <div className="text-muted" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
            <p><strong>TEL:</strong> {userData.info.tel}</p>
            <p><strong>BANQUE:</strong> {userData.info.banque}</p>
          </div>
        </div>

        {/* Carte Économie (Farm) */}
        <div className="glass-panel" style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}>
          <h3 className="text-muted" style={{ fontSize: '0.9rem' }}>CRÉDITS NON SÉCURISÉS</h3>
          <div style={{ fontSize: '3rem', fontFamily: 'Rajdhani', fontWeight: 'bold', color: 'var(--primary)' }}>
            {userData.economy.enAttente} $
          </div>
          
          <div style={{ margin: '1.5rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '0.8rem' }}>QUOTA JOURNALIER</span>
              <span style={{ fontSize: '0.8rem' }}>{userData.game?.lastQuestionDate === today ? userData.game?.dailyCount : 0} / 5</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
              <div style={{ 
                width: `${((userData.game?.lastQuestionDate === today ? userData.game?.dailyCount : 0) / 5) * 100}%`, 
                height: '100%', 
                background: 'var(--primary)',
                boxShadow: '0 0 10px var(--primary)',
                transition: 'width 0.5s ease'
              }}></div>
            </div>
          </div>

          <button onClick={handleFarm} className="btn-primary w-full">
            EFFECTUER MISSION (+50$)
          </button>
        </div>

        {/* Carte Banque */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 className="text-muted" style={{ fontSize: '0.9rem' }}>CAPITAL SÉCURISÉ</h3>
          <div style={{ fontSize: '3rem', fontFamily: 'Rajdhani', fontWeight: 'bold', color: '#00ff9d' }}>
            {userData.economy.gagneTotal} $
          </div>

          <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '1.5rem 0' }} />

          {userData.economy.statutRetrait === 'waiting' ? (
            <div style={{ background: 'rgba(255, 193, 7, 0.1)', color: '#ffc107', padding: '1rem', border: '1px solid #ffc107', borderRadius: '4px', textAlign: 'center' }}>
              ⏳ TRANSFERT EN COURS DE VALIDATION
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Seuil de transfert minimum : 2000 $
              </p>
              <button 
                onClick={handleWithdraw} 
                className="btn-secondary w-full"
                disabled={userData.economy.enAttente < 2000}
                style={{ opacity: userData.economy.enAttente < 2000 ? 0.5 : 1 }}
              >
                DEMANDER VIREMENT
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL ÉDITION */}
      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '90%', maxWidth: '500px' }}>
            <h3 className="text-cyan">MISE À JOUR DONNÉES</h3>
            
            <div style={{ display: 'grid', gap: '1rem', margin: '1.5rem 0' }}>
              <input placeholder="URL Avatar" value={editForm.avatar} onChange={(e) => setEditForm({...editForm, avatar: e.target.value})} />
              <input placeholder="Métier" value={editForm.metier} onChange={(e) => setEditForm({...editForm, metier: e.target.value})} />
              <input placeholder="Téléphone" value={editForm.tel} onChange={(e) => setEditForm({...editForm, tel: e.target.value})} />
              <input placeholder="Banque" value={editForm.banque} onChange={(e) => setEditForm({...editForm, banque: e.target.value})} />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-primary w-full" onClick={saveProfile}>SAUVEGARDER</button>
              <button className="btn-danger w-full" onClick={() => setModalOpen(false)}>ANNULER</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}