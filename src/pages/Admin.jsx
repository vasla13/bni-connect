import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, runTransaction, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const [tab, setTab] = useState('paiements');
  const [withdrawals, setWithdrawals] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // --- NOUVEAU : États pour Popups/Toasts ---
  const [confirmModal, setConfirmModal] = useState({ open: false, item: null }); // Pour stocker l'objet à valider
  const [toast, setToast] = useState(null); // Pour le message temporaire

  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) return navigate('/');
    const unsubPay = onSnapshot(collection(db, "withdrawals"), (s) => setWithdrawals(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubUsers = onSnapshot(collection(db, "users"), (s) => setUsers(s.docs.map(d => ({ uid: d.id, ...d.data() }))));
    return () => { unsubPay(); unsubUsers(); };
  }, [navigate]);

  // --- LOGIQUE TOAST (Notification temporaire) ---
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000); // Disparait après 3 sec
  };

  const copyToClip = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copié dans le presse-papier`);
  };

  // --- LOGIQUE CONFIRMATION (Remplace window.confirm) ---
  const requestValidation = (item) => {
    setConfirmModal({ open: true, item: item });
  };

  const executePayment = async () => {
    const w = confirmModal.item;
    if (!w) return;

    try {
      await runTransaction(db, async (t) => {
        const userRef = doc(db, "users", w.userId);
        const userDoc = await t.get(userRef);
        if(!userDoc.exists()) throw "User missing";
        
        const currentData = userDoc.data();
        const newEnAttente = Math.max(0, (currentData.economy.enAttente || 0) - w.montant);
        
        t.update(userRef, {
          "economy.enAttente": newEnAttente,
          "economy.gagneTotal": (currentData.economy.gagneTotal || 0) + w.montant,
          "economy.statutRetrait": "aucun"
        });
        t.delete(doc(db, "withdrawals", w.id));
      });
      showToast(`Virement de ${w.montant}$ validé avec succès.`);
    } catch(e) { 
      alert(e); // Fallback erreur critique
    } finally {
      setConfirmModal({ open: false, item: null });
    }
  };

  // --- LOGIQUE USERS ---
  const saveUserChanges = async () => {
    if(!selectedUser) return;
    await updateDoc(doc(db, "users", selectedUser.uid), { info: selectedUser.info });
    showToast("Profil utilisateur sauvegardé.");
    setSelectedUser(null);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Toast Container */}
      {toast && <div className="toast-container">ℹ {toast}</div>}

      <header style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button className={tab === 'paiements' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('paiements')}>PAIEMENTS</button>
        <button className={tab === 'users' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('users')}>UTILISATEURS</button>
        <div style={{ flex: 1 }}></div>
        <button className="btn-danger" onClick={() => navigate('/dashboard')}>QUITTER</button>
      </header>

      {/* --- ONGLET PAIEMENTS --- */}
      {tab === 'paiements' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
          {withdrawals.map(w => (
            <div key={w.id} className="glass-panel" style={{ padding: '1.5rem', position: 'relative' }}>
              <h3 className="text-cyan">{w.nomComplet}</h3>
              <button style={{ position: 'absolute', top: 20, right: 10, fontSize: '0.7rem' }} className="btn-secondary" onClick={() => copyToClip(w.nomComplet, "Nom")}>COPIER</button>

              <div style={{ margin: '1rem 0', position: 'relative' }}>
                <small className="text-muted">BANQUE</small>
                <div style={{ fontFamily: 'monospace' }}>{w.compteBancaire}</div>
                <button style={{ position: 'absolute', top: 0, right: -5, padding: '2px 5px' }} className="btn-secondary" onClick={() => copyToClip(w.compteBancaire, "IBAN")}>COPIER</button>
              </div>

              <div style={{ margin: '1rem 0', position: 'relative' }}>
                <small className="text-muted">TÉLÉPHONE</small>
                <div>{w.tel || 'N/A'}</div>
                <button style={{ position: 'absolute', top: 0, right: -5, padding: '2px 5px' }} className="btn-secondary" onClick={() => copyToClip(w.tel, "Téléphone")}>COPIER</button>
              </div>

              <div style={{ margin: '1rem 0', position: 'relative' }}>
                <small className="text-muted">MONTANT DÛ</small>
                <div style={{ fontSize: '1.5rem', color: 'orange' }}>{w.montant} $</div>
                <button style={{ position: 'absolute', top: 0, right: -5, padding: '2px 5px' }} className="btn-secondary" onClick={() => copyToClip(w.montant, "Montant")}>COPIER</button>
              </div>

              {/* Bouton qui ouvre la modale au lieu de confirm() */}
              <button className="btn-primary w-full" onClick={() => requestValidation(w)}>AUTORISER VIREMENT</button>
            </div>
          ))}
          {withdrawals.length === 0 && <p className="text-muted">Aucune demande en attente.</p>}
        </div>
      )}

      {/* --- ONGLET UTILISATEURS --- */}
      {tab === 'users' && (
        <div>
          {!selectedUser ? (
            <div className="glass-panel">
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead><tr><th style={{padding:'10px'}}>Nom</th><th style={{padding:'10px'}}>Métier</th><th style={{padding:'10px'}}>Action</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.uid} style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <td style={{padding:'10px'}}>{u.info.prenom} {u.info.nom}</td>
                      <td style={{padding:'10px'}}>{u.info.metier}</td>
                      <td style={{padding:'10px'}}>
                        <button className="btn-secondary" onClick={() => setSelectedUser(u)}>GERER</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <button className="btn-secondary" style={{ marginBottom: '1rem' }} onClick={() => setSelectedUser(null)}>← RETOUR LISTE</button>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                   <h3 className="text-cyan">INFORMATIONS CIVILES</h3>
                   <div style={{ display: 'grid', gap: '10px' }}>
                     <label>Avatar URL</label> <input value={selectedUser.info.avatar} onChange={e => setSelectedUser({...selectedUser, info: {...selectedUser.info, avatar: e.target.value}})} />
                     <label>Prénom</label> <input value={selectedUser.info.prenom} onChange={e => setSelectedUser({...selectedUser, info: {...selectedUser.info, prenom: e.target.value}})} />
                     <label>Nom</label> <input value={selectedUser.info.nom} onChange={e => setSelectedUser({...selectedUser, info: {...selectedUser.info, nom: e.target.value}})} />
                     <label>Tel</label> <input value={selectedUser.info.tel} onChange={e => setSelectedUser({...selectedUser, info: {...selectedUser.info, tel: e.target.value}})} />
                     <label>Date Naissance</label> <input value={selectedUser.info.dob} onChange={e => setSelectedUser({...selectedUser, info: {...selectedUser.info, dob: e.target.value}})} />
                     <div className="glass-panel" style={{ padding: '10px', marginTop: '10px' }}>
                       <label>Sexe</label> <input value={selectedUser.info.sexe} onChange={e => setSelectedUser({...selectedUser, info: {...selectedUser.info, sexe: e.target.value}})} />
                       <label>Peau</label> <input value={selectedUser.info.peau} onChange={e => setSelectedUser({...selectedUser, info: {...selectedUser.info, peau: e.target.value}})} />
                       <label>Cheveux</label> <input value={selectedUser.info.cheveux} onChange={e => setSelectedUser({...selectedUser, info: {...selectedUser.info, cheveux: e.target.value}})} />
                       <label>Métier</label> <input value={selectedUser.info.metier} onChange={e => setSelectedUser({...selectedUser, info: {...selectedUser.info, metier: e.target.value}})} />
                     </div>
                     <button className="btn-primary" style={{ marginTop: '10px' }} onClick={saveUserChanges}>SAUVEGARDER MODIFICATIONS</button>
                   </div>
                </div>
                <div>
                   <h3 className="text-danger">DOSSIER SENSIBLE</h3>
                   <h4 className="text-muted">FICHÉES (TAGS)</h4>
                   {selectedUser.game?.answers?.filter(a => a.tag && a.tag !== "SANS TAG").map((a, i) => (
                     <div key={i} style={{ background: 'rgba(255, 42, 42, 0.1)', border: '1px solid var(--danger)', padding: '10px', marginBottom: '10px', borderRadius: '4px' }}>
                       <strong style={{ color: 'var(--danger)' }}>[{a.tag}]</strong> : <span style={{ color: 'white' }}>{a.reponse}</span>
                       <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>Q: {a.question}</div>
                     </div>
                   ))}
                   <h4 className="text-muted" style={{ marginTop: '2rem' }}>AUTRES RÉPONSES</h4>
                   {selectedUser.game?.answers?.filter(a => !a.tag || a.tag === "SANS TAG").map((a, i) => (
                     <div key={i} style={{ padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                       <div>{a.reponse}</div>
                       <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{a.question}</div>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- MODALE DE CONFIRMATION DE PAIEMENT --- */}
      {confirmModal.open && confirmModal.item && (
        <div className="modal-overlay">
          <div className="glass-panel" style={{ padding: '2rem', maxWidth: '400px', width: '90%', textAlign: 'center', border: '1px solid var(--primary)' }}>
            <h3 className="text-cyan">CONFIRMATION REQUISE</h3>
            <p className="text-muted" style={{ margin: '1.5rem 0' }}>
              Autoriser le transfert de <strong>{confirmModal.item.montant} $</strong> vers le compte de {confirmModal.item.nomComplet} ?
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
               <button className="btn-primary w-full" onClick={executePayment}>OUI, VALIDER</button>
               <button className="btn-danger w-full" onClick={() => setConfirmModal({ open: false, item: null })}>ANNULER</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}