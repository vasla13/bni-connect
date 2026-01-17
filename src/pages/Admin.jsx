import { useEffect, useState } from 'react';
import { db, functions } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

// Icônes simples (si tu n'as pas lucide-react, utilise du texte)
const IconCopy = () => <span>📋</span>;

export default function Admin() {
  const [tab, setTab] = useState('paiements'); // 'paiements' | 'users'
  const [withdrawals, setWithdrawals] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  // 1. Listeners Temps Réel
  useEffect(() => {
    // A. Paiements en attente
    const qW = query(collection(db, "withdrawals"), where("statut", "==", "pending"));
    const unsubW = onSnapshot(qW, (snap) => {
      setWithdrawals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // B. Tous les utilisateurs
    const unsubU = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubW(); unsubU(); };
  }, []);

  // 2. Actions Admin
  const handleValidatePayment = async (withdrawalId) => {
    if(!window.confirm("Valider ce virement ?")) return;
    try {
      const manageWithdrawal = httpsCallable(functions, 'manageWithdrawal');
      await manageWithdrawal({ withdrawalId, action: 'approve' });
      // L'UI se mettra à jour toute seule via le snapshot
    } catch (e) { alert("Erreur: " + e.message); }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Petit feedback visuel rapide si tu veux, ici simple alert
    // alert("Copié !"); 
  };

  const saveUserChanges = async () => {
    if (!selectedUser) return;
    try {
        await updateDoc(doc(db, "users", selectedUser.id), {
            "info": selectedUser.info
        });
        alert("Profil mis à jour !");
    } catch (e) { console.error(e); }
  };

  return (
    <div className="container">
      <h1 className="text-cyan mb-6" style={{ letterSpacing: '3px' }}>ADMINISTRATION CENTRALE</h1>
      
      {/* TABS */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <button 
            className={tab === 'paiements' ? 'btn-main' : 'btn-secondary'} 
            onClick={() => setTab('paiements')}
        >
            DEMANDES DE PAIEMENT ({withdrawals.length})
        </button>
        <button 
            className={tab === 'users' ? 'btn-main' : 'btn-secondary'} 
            onClick={() => setTab('users')}
        >
            GESTION UTILISATEURS
        </button>
      </div>

      {/* --- ONGLET 1 : PAIEMENTS --- */}
      {tab === 'paiements' && (
        <div className="grid-2">
          {withdrawals.length === 0 && <p className="text-muted">Aucune demande en cours.</p>}
          
          {withdrawals.map(w => (
            <div key={w.id} className="pro-card" style={{ borderLeft: '4px solid var(--warning)', position: 'relative' }}>
              <h3 className="text-warning mb-4">VIREMENT EN ATTENTE</h3>
              
              {/* Nom */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                 <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>BÉNÉFICIAIRE</label>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{w.nomComplet}</div>
                 </div>
                 <button className="btn-secondary" onClick={() => copyToClipboard(w.nomComplet)}><IconCopy/></button>
              </div>

              {/* Banque */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                 <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>IBAN / BANQUE</label>
                    <div style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '5px' }}>{w.banque || "Non renseigné"}</div>
                 </div>
                 <button className="btn-secondary" onClick={() => copyToClipboard(w.banque)}><IconCopy/></button>
              </div>

              {/* Téléphone */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                 <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TÉLÉPHONE</label>
                    <div>{w.telephone || "Non renseigné"}</div>
                 </div>
                 <button className="btn-secondary" onClick={() => copyToClipboard(w.telephone)}><IconCopy/></button>
              </div>

              {/* Montant */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '4px' }}>
                 <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--success)' }}>MONTANT À VERSER</label>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>{w.montant} $</div>
                 </div>
                 <button className="btn-secondary" onClick={() => copyToClipboard(w.montant)}><IconCopy/></button>
              </div>

              <button className="btn-main w-full" onClick={() => handleValidatePayment(w.id)}>VALIDER LE PAIEMENT</button>
            </div>
          ))}
        </div>
      )}

      {/* --- ONGLET 2 : UTILISATEURS --- */}
      {tab === 'users' && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
            
            {/* Liste Gauche */}
            <div className="pro-card">
                <input placeholder="Rechercher..." style={{ marginBottom: '10px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '70vh', overflowY: 'auto' }}>
                    {users.map(u => (
                        <div key={u.id} 
                             onClick={() => setSelectedUser(u)}
                             style={{ 
                                padding: '10px', cursor: 'pointer', borderRadius: '4px',
                                background: selectedUser?.id === u.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                color: selectedUser?.id === u.id ? 'black' : 'white',
                                fontWeight: selectedUser?.id === u.id ? 'bold' : 'normal'
                             }}>
                            {u.info.nom} {u.info.prenom}
                        </div>
                    ))}
                </div>
            </div>

            {/* Détails Droite */}
            {selectedUser ? (
                <div className="pro-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '20px' }}>
                        <img src={selectedUser.info.photoUrl || 'https://via.placeholder.com/100'} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
                        <div>
                            <h2 style={{ margin: 0 }}>{selectedUser.info.nom} {selectedUser.info.prenom}</h2>
                            <span className="text-muted">{selectedUser.info.email}</span>
                        </div>
                    </div>

                    {/* BOX 1 : IDENTITÉ */}
                    <h4 className="text-cyan mb-2">IDENTITÉ & SÉCURITÉ</h4>
                    <div className="grid-2 mb-4" style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px' }}>
                        <div className="input-group"><label>Nom</label><input value={selectedUser.info.nom} onChange={e => setSelectedUser({...selectedUser, info: {...selectedUser.info, nom: e.target.value}})} /></div>
                        <div className="input-group"><label>Prénom</label><input value={selectedUser.info.prenom} onChange={e => setSelectedUser({...selectedUser, info: {...selectedUser.info, prenom: e.target.value}})} /></div>
                        <div className="input-group"><label>Date Naissance</label><input type="date" value={selectedUser.info.dateNaissance} onChange={e => setSelectedUser({...selectedUser, info: {...selectedUser.info, dateNaissance: e.target.value}})} /></div>
                        <div className="input-group"><label>Téléphone</label><input value={selectedUser.info.telephone} onChange={e => setSelectedUser({...selectedUser, info: {...selectedUser.info, telephone: e.target.value}})} /></div>
                        <div className="input-group"><label>Banque (IBAN)</label><input value={selectedUser.info.banque} onChange={e => setSelectedUser({...selectedUser, info: {...selectedUser.info, banque: e.target.value}})} /></div>
                        <div className="input-group"><label>Photo URL</label><input value={selectedUser.info.photoUrl} onChange={e => setSelectedUser({...selectedUser, info: {...selectedUser.info, photoUrl: e.target.value}})} /></div>
                    </div>

                    {/* BOX 2 : PHYSIQUE / MÉTIER */}
                    <h4 className="text-cyan mb-2">PHYSIQUE & PROFIL</h4>
                    <div className="grid-2 mb-4" style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px' }}>
                         <div className="input-group"><label>Métier</label><input value={selectedUser.info.metier} onChange={e => setSelectedUser({...selectedUser, info: {...selectedUser.info, metier: e.target.value}})} /></div>
                         <div className="input-group"><label>Sexe</label><input value={selectedUser.info.sexe} onChange={e => setSelectedUser({...selectedUser, info: {...selectedUser.info, sexe: e.target.value}})} /></div>
                         <div className="input-group"><label>Couleur Peau</label><input value={selectedUser.info.peau} onChange={e => setSelectedUser({...selectedUser, info: {...selectedUser.info, peau: e.target.value}})} /></div>
                         <div className="input-group"><label>Couleur Cheveux</label><input value={selectedUser.info.cheveux} onChange={e => setSelectedUser({...selectedUser, info: {...selectedUser.info, cheveux: e.target.value}})} /></div>
                    </div>

                    <button className="btn-main mb-6" onClick={saveUserChanges}>ENREGISTRER LES MODIFICATIONS</button>

                    <hr style={{ borderColor: 'var(--glass-border)', margin: '2rem 0' }} />

                    {/* BOX 3 : RÉPONSES SENSIBLES TAGGÉES */}
                    <h3 className="text-warning">DONNÉES SENSIBLES (TAGGÉES)</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                        {selectedUser.game.answers && selectedUser.game.answers.filter(a => a.tag && a.tag !== "SANS TAG").length > 0 ? (
                            selectedUser.game.answers.filter(a => a.tag && a.tag !== "SANS TAG").map((ans, i) => (
                                <div key={i} style={{ 
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '12px', background: 'rgba(245, 158, 11, 0.1)', 
                                    border: '1px solid var(--warning)', borderRadius: '4px' 
                                }}>
                                    <span style={{ fontWeight: 'bold', color: 'var(--warning)', minWidth: '150px' }}>[{ans.tag}]</span>
                                    <span style={{ flex: 1, textAlign: 'right' }}>{ans.reponse}</span>
                                </div>
                            ))
                        ) : <p className="text-muted">Aucune donnée taggée enregistrée.</p>}
                    </div>

                    {/* BOX 4 : AUTRES RÉPONSES SENSIBLES */}
                    <h3 className="text-muted">AUTRES ENQUÊTES</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {selectedUser.game.answers && selectedUser.game.answers.filter(a => (!a.tag || a.tag === "SANS TAG")).length > 0 ? (
                             selectedUser.game.answers.filter(a => (!a.tag || a.tag === "SANS TAG")).map((ans, i) => (
                                <div key={i} style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>{ans.question}</div>
                                    <div style={{ fontStyle: 'italic' }}>"{ans.reponse}"</div>
                                </div>
                            ))
                        ) : <p className="text-muted">Aucune autre réponse.</p>}
                    </div>

                </div>
            ) : (
                <div className="flex-center text-muted" style={{ border: '2px dashed var(--glass-border)', borderRadius: '8px' }}>
                    SÉLECTIONNEZ UN MATRICULE POUR VOIR LE DOSSIER
                </div>
            )}
        </div>
      )}
    </div>
  );
}