import { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, runTransaction, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('pay');
  const [withdrawals, setW] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelUser] = useState(null);
  
  // États Popups
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, item: null });

  useEffect(() => {
    if (!auth.currentUser) return navigate('/');
    const u1 = onSnapshot(collection(db, "withdrawals"), s => setW(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u2 = onSnapshot(collection(db, "users"), s => setUsers(s.docs.map(d => ({ uid: d.id, ...d.data() }))));
    return () => { u1(); u2(); };
  }, [navigate]);

  // Logique Copier (Toast)
  const copy = (txt) => {
    navigator.clipboard.writeText(txt);
    setToast("Donnée copiée dans le presse-papier");
    setTimeout(() => setToast(null), 2500);
  };

  // Logique Paiement
  const executePay = async () => {
    const w = confirmModal.item;
    if (!w) return;
    try {
      await runTransaction(db, async (t) => {
        const uRef = doc(db, "users", w.userId);
        const uDoc = await t.get(uRef);
        if (!uDoc.exists()) return;
        const newAtt = Math.max(0, uDoc.data().economy.enAttente - w.montant);
        t.update(uRef, { 
          "economy.enAttente": newAtt, 
          "economy.gagneTotal": uDoc.data().economy.gagneTotal + w.montant, 
          "economy.statutRetrait": "aucun" 
        });
        t.delete(doc(db, "withdrawals", w.id));
      });
      setConfirmModal({ open: false, item: null });
      setToast("Virement validé avec succès");
      setTimeout(() => setToast(null), 2500);
    } catch (e) { alert(e); }
  };

  // Logique User
  const saveUser = async () => {
    if (selectedUser) {
      await updateDoc(doc(db, "users", selectedUser.uid), { info: selectedUser.info });
      setSelUser(null);
      setToast("Profil utilisateur mis à jour");
      setTimeout(() => setToast(null), 2500);
    }
  };

  return (
    <div className="container">
      {toast && <div className="toast">{toast}</div>}

      <div className="pro-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: 'white' }}>SUPERVISION BNI</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className={tab === 'pay' ? 'btn-main' : 'btn-secondary'} onClick={() => setTab('pay')} style={{ width: 'auto' }}>PAIEMENTS</button>
          <button className={tab === 'users' ? 'btn-main' : 'btn-secondary'} onClick={() => setTab('users')} style={{ width: 'auto' }}>CITOYENS</button>
          <button className="btn-danger" onClick={() => navigate('/dashboard')}>QUITTER</button>
        </div>
      </div>

      {/* TAB PAIEMENTS */}
      {tab === 'pay' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {withdrawals.length === 0 && <p className="text-muted">Aucune demande en attente.</p>}
          {withdrawals.map(w => (
            <div key={w.id} className="pro-card" style={{ position: 'relative' }}>
              <h3 className="text-cyan">{w.nomComplet} <button className="btn-secondary" style={{ fontSize: '0.6rem', padding: '2px 6px' }} onClick={() => copy(w.nomComplet)}>COPIER</button></h3>
              <div style={{ margin: '10px 0' }}>IBAN: <strong style={{ fontFamily: 'monospace' }}>{w.compteBancaire}</strong> <button className="btn-secondary" style={{ fontSize: '0.6rem', padding: '2px 6px' }} onClick={() => copy(w.compteBancaire)}>COPIER</button></div>
              <div style={{ margin: '10px 0' }}>TEL: {w.tel} <button className="btn-secondary" style={{ fontSize: '0.6rem', padding: '2px 6px' }} onClick={() => copy(w.tel)}>COPIER</button></div>
              <div style={{ fontSize: '1.5rem', color: 'var(--warning)', margin: '15px 0' }}>{w.montant} $ <button className="btn-secondary" style={{ fontSize: '0.6rem', padding: '2px 6px' }} onClick={() => copy(w.montant)}>COPIER</button></div>
              <button className="btn-main" onClick={() => setConfirmModal({ open: true, item: w })}>VALIDER VIREMENT</button>
            </div>
          ))}
        </div>
      )}

      {/* TAB USERS */}
      {tab === 'users' && !selectedUser && (
        <div className="pro-card">
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}><th style={{ padding: '10px' }}>NOM</th><th>MÉTIER</th><th>ACTION</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.uid} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px' }}>{u.info.prenom} {u.info.nom}</td>
                  <td>{u.info.metier}</td>
                  <td><button className="btn-secondary" onClick={() => setSelUser(u)}>GÉRER</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DETAIL USER */}
      {tab === 'users' && selectedUser && (
        <div className="pro-card">
          <button className="btn-secondary" onClick={() => setSelUser(null)}>← RETOUR LISTE</button>
          <div className="grid-2" style={{ marginTop: '20px' }}>
            <div>
              <h3 className="text-cyan">INFOS CIVILES</h3>
              <div className="input-group"><label>Prénom</label><input value={selectedUser.info.prenom} onChange={e => setSelUser({ ...selectedUser, info: { ...selectedUser.info, prenom: e.target.value } })} /></div>
              <div className="input-group"><label>Nom</label><input value={selectedUser.info.nom} onChange={e => setSelUser({ ...selectedUser, info: { ...selectedUser.info, nom: e.target.value } })} /></div>
              <div className="input-group"><label>Métier</label><input value={selectedUser.info.metier} onChange={e => setSelUser({ ...selectedUser, info: { ...selectedUser.info, metier: e.target.value } })} /></div>
              <button className="btn-main" style={{ marginTop: '10px' }} onClick={saveUser}>SAUVEGARDER MODIFICATIONS</button>
            </div>
            <div>
              <h3 style={{ color: 'var(--danger)' }}>DOSSIER SENSIBLE</h3>
              {selectedUser.game?.answers?.filter(a => a.tag && a.tag !== "SANS TAG").map((a, i) => (
                <div key={i} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', padding: '10px', marginBottom: '10px', borderRadius: '4px' }}>
                  <strong style={{ color: 'var(--danger)' }}>[{a.tag}]</strong> {a.reponse}
                </div>
              ))}
              {(!selectedUser.game?.answers || selectedUser.game.answers.length === 0) && <p className="text-muted">Aucune donnée signalée.</p>}
            </div>
          </div>
        </div>
      )}

      {/* MODALE CONFIRMATION PAIEMENT */}
      {confirmModal.open && (
        <div className="overlay">
          <div className="modal-box">
            <h3 className="text-cyan">CONFIRMATION</h3>
            <p>Valider le virement de <strong>{confirmModal.item.montant}$</strong> pour {confirmModal.item.nomComplet} ?</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn-main" onClick={executePay}>OUI, PAYER</button>
              <button className="btn-danger" onClick={() => setConfirmModal({ open: false, item: null })}>ANNULER</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}