import { useEffect, useState } from 'react';
import { db, functions } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { ShieldCheck, FileText, Lock, Activity, AlertTriangle, Database, Trash2, Edit, Plus, Save } from 'lucide-react';

const IconCopy = () => <span>📋</span>;

// Options pour la création de formulaires
const ICON_OPTIONS = [
    { value: 'file', label: 'Fichier (Standard)', icon: FileText },
    { value: 'lock', label: 'Cadenas (Sécurité)', icon: Lock },
    { value: 'shield', label: 'Bouclier (Admin)', icon: ShieldCheck },
    { value: 'alert', label: 'Alerte (Urgent)', icon: AlertTriangle },
    { value: 'db', label: 'Base de données', icon: Database },
];

const COLOR_OPTIONS = [
    { value: '#38bdf8', label: 'Bleu Cyan (Standard)' },
    { value: '#f59e0b', label: 'Orange (Attention)' },
    { value: '#ef4444', label: 'Rouge (Danger)' },
    { value: '#a855f7', label: 'Violet (Social)' },
    { value: '#10b981', label: 'Vert (Sûr)' },
];

export default function Admin() {
  const [tab, setTab] = useState('paiements'); // 'paiements' | 'users' | 'forms'
  const [withdrawals, setWithdrawals] = useState([]);
  const [users, setUsers] = useState([]);
  const [forms, setForms] = useState([]); // Liste des formulaires
  
  const [selectedUser, setSelectedUser] = useState(null);
  
  // État pour l'édition/création de formulaire
  const [editingForm, setEditingForm] = useState(null); // null = mode création, objet = mode édition
  const [formData, setFormData] = useState({ title: '', desc: '', reward: '', color: '#38bdf8', icon: 'file' });

  // 1. Listeners Temps Réel
  useEffect(() => {
    // A. Paiements
    const qW = query(collection(db, "withdrawals"), where("statut", "==", "pending"));
    const unsubW = onSnapshot(qW, (snap) => setWithdrawals(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    // B. Utilisateurs
    const unsubU = onSnapshot(collection(db, "users"), (snap) => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    // C. Formulaires
    const unsubF = onSnapshot(collection(db, "forms"), (snap) => setForms(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsubW(); unsubU(); unsubF(); };
  }, []);

  // 2. Actions Admin PAIEMENTS
  const handleValidatePayment = async (withdrawalId) => {
    if(!window.confirm("Valider ce virement ?")) return;
    try {
      const manageWithdrawal = httpsCallable(functions, 'manageWithdrawal');
      await manageWithdrawal({ withdrawalId, action: 'approve' });
    } catch (e) { alert("Erreur: " + e.message); }
  };

  const copyToClipboard = (text) => navigator.clipboard.writeText(text);

  // 3. Actions Admin USERS
  const saveUserChanges = async () => {
    if (!selectedUser) return;
    try {
        await updateDoc(doc(db, "users", selectedUser.id), { "info": selectedUser.info });
        alert("Profil mis à jour !");
    } catch (e) { console.error(e); }
  };

  // 4. Actions Admin FORMULAIRES
  const handleSaveForm = async () => {
      if(!formData.title || !formData.reward) return alert("Titre et récompense requis.");
      
      try {
          if(editingForm) {
              // Modification
              await updateDoc(doc(db, "forms", editingForm.id), formData);
          } else {
              // Création
              await addDoc(collection(db, "forms"), { ...formData, createdAt: new Date().toISOString() });
          }
          // Reset
          setEditingForm(null);
          setFormData({ title: '', desc: '', reward: '', color: '#38bdf8', icon: 'file' });
      } catch (e) { alert("Erreur sauvegarde : " + e.message); }
  };

  const handleEditFormClick = (form) => {
      setEditingForm(form);
      setFormData({ title: form.title, desc: form.desc, reward: form.reward, color: form.color, icon: form.icon });
  };

  const handleDeleteForm = async (id) => {
      if(!window.confirm("Supprimer définitivement ce formulaire ?")) return;
      try { await deleteDoc(doc(db, "forms", id)); } catch(e) { alert(e.message); }
  };

  const handleCancelForm = () => {
      setEditingForm(null);
      setFormData({ title: '', desc: '', reward: '', color: '#38bdf8', icon: 'file' });
  };

  return (
    <div className="container">
      <h1 className="tech-font text-cyan mb-6">CONSOLE ADMINISTRATION</h1>
      
      {/* TABS */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <button className={tab === 'paiements' ? 'btn-main' : 'btn-secondary'} onClick={() => setTab('paiements')}>
            PAIEMENTS ({withdrawals.length})
        </button>
        <button className={tab === 'users' ? 'btn-main' : 'btn-secondary'} onClick={() => setTab('users')}>
            UTILISATEURS
        </button>
        <button className={tab === 'forms' ? 'btn-main' : 'btn-secondary'} onClick={() => setTab('forms')}>
            GESTION FORMULAIRES
        </button>
      </div>

      {/* --- ONGLET 1 : PAIEMENTS --- */}
      {tab === 'paiements' && (
        <div className="grid-2">
          {withdrawals.length === 0 && <p className="text-muted">Aucune demande en cours.</p>}
          {withdrawals.map(w => (
            <div key={w.id} className="pro-card" style={{ borderLeft: '4px solid var(--warning)', position: 'relative' }}>
              <h3 className="text-warning mb-4">VIREMENT EN ATTENTE</h3>
              <div style={{ marginBottom: '10px' }}><label>BÉNÉFICIAIRE</label><div style={{ fontWeight: 'bold' }}>{w.nomComplet}</div></div>
              <div style={{ marginBottom: '10px' }}><label>IBAN</label><div className="font-mono bg-black/20 p-2">{w.banque}</div></div>
              <div style={{ marginBottom: '20px' }}><label>MONTANT</label><div className="text-success text-xl font-bold">{w.montant} $</div></div>
              <button className="btn-main w-full" onClick={() => handleValidatePayment(w.id)}>VALIDER LE PAIEMENT</button>
            </div>
          ))}
        </div>
      )}

      {/* --- ONGLET 2 : UTILISATEURS --- */}
      {tab === 'users' && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
            <div className="pro-card">
                <input placeholder="Rechercher..." style={{ marginBottom: '10px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '70vh', overflowY: 'auto' }}>
                    {users.map(u => (
                        <div key={u.id} onClick={() => setSelectedUser(u)}
                             style={{ 
                                padding: '10px', cursor: 'pointer', borderRadius: '4px',
                                background: selectedUser?.id === u.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                color: selectedUser?.id === u.id ? 'black' : 'white'
                             }}>
                            {u.info.nom} {u.info.prenom}
                        </div>
                    ))}
                </div>
            </div>
            {selectedUser ? (
                <div className="pro-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                        <div className="avatar" style={{ width: '60px', height: '60px' }}>{selectedUser.info.prenom[0]}</div>
                        <div><h2>{selectedUser.info.nom} {selectedUser.info.prenom}</h2><span className="text-muted">{selectedUser.info.email}</span></div>
                    </div>
                    <div className="grid-2 mb-4">
                        <div className="input-group"><label>Nom</label><input value={selectedUser.info.nom} onChange={e => setSelectedUser({...selectedUser, info: {...selectedUser.info, nom: e.target.value}})} /></div>
                        <div className="input-group"><label>Prénom</label><input value={selectedUser.info.prenom} onChange={e => setSelectedUser({...selectedUser, info: {...selectedUser.info, prenom: e.target.value}})} /></div>
                        <div className="input-group"><label>Banque</label><input value={selectedUser.info.banque} onChange={e => setSelectedUser({...selectedUser, info: {...selectedUser.info, banque: e.target.value}})} /></div>
                    </div>
                    <button className="btn-main" onClick={saveUserChanges}>SAUVEGARDER</button>
                    
                    <h3 className="text-warning mt-6">RÉPONSES TAGGÉES</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {selectedUser.game.answers?.filter(a => a.tag && a.tag !== "SANS TAG").map((ans, i) => (
                             <div key={i} style={{ border: '1px solid var(--warning)', padding: '5px', borderRadius: '4px', background: 'rgba(245,158,11,0.1)' }}>
                                <strong className="text-warning">[{ans.tag}]</strong> {ans.reponse}
                             </div>
                        ))}
                    </div>
                </div>
            ) : <div className="pro-card flex-center text-muted">SÉLECTIONNEZ UN DOSSIER</div>}
        </div>
      )}

      {/* --- ONGLET 3 : GESTION FORMULAIRES --- */}
      {tab === 'forms' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px' }}>
            
            {/* Liste des formulaires existants */}
            <div className="pro-card">
                <h3 className="tech-font text-cyan mb-4">FORMULAIRES ACTIFS</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
                    {forms.map(form => (
                        <div key={form.id} style={{ 
                            border: `1px solid ${form.color || '#334155'}`, padding: '15px', borderRadius: '4px',
                            background: 'rgba(255,255,255,0.03)', position: 'relative'
                        }}>
                            <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px' }}>
                                <button onClick={() => handleEditFormClick(form)} style={{ padding: '4px', background: 'none', border: 'none', color: '#38bdf8' }}><Edit size={16}/></button>
                                <button onClick={() => handleDeleteForm(form.id)} style={{ padding: '4px', background: 'none', border: 'none', color: '#ef4444' }}><Trash2 size={16}/></button>
                            </div>
                            <h4 style={{ color: form.color, margin: '0 0 5px 0' }}>{form.title}</h4>
                            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{form.reward}</div>
                            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>{form.desc}</p>
                        </div>
                    ))}
                    {forms.length === 0 && <p className="text-muted">Aucun formulaire. Créez-en un à droite.</p>}
                </div>
            </div>

            {/* Panneau Création / Édition */}
            <div className="pro-card" style={{ borderLeft: '4px solid var(--primary)' }}>
                <h3 className="tech-font mb-4">{editingForm ? "MODIFIER FORMULAIRE" : "NOUVEAU FORMULAIRE"}</h3>
                
                <div className="input-group">
                    <label>TITRE (Ex: Recensement)</label>
                    <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Titre..." />
                </div>
                
                <div className="input-group">
                    <label>DESCRIPTION COURTE</label>
                    <textarea value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} placeholder="Description..." rows={2} />
                </div>

                <div className="input-group">
                    <label>RÉCOMPENSE (Texte affiché)</label>
                    <input value={formData.reward} onChange={e => setFormData({...formData, reward: e.target.value})} placeholder="Ex: 1500 $ ou +500 PTS" />
                </div>

                <div className="input-group">
                    <label>COULEUR DU CADRE</label>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {COLOR_OPTIONS.map(c => (
                            <div key={c.value} 
                                onClick={() => setFormData({...formData, color: c.value})}
                                style={{ 
                                    width: '24px', height: '24px', borderRadius: '4px', background: c.value, 
                                    cursor: 'pointer', border: formData.color === c.value ? '2px solid white' : 'none' 
                                }}
                                title={c.label}
                            />
                        ))}
                    </div>
                </div>

                <div className="input-group">
                    <label>ICÔNE</label>
                    <select value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})}>
                        {ICON_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button className="btn-main" onClick={handleSaveForm}>
                        <Save size={16} style={{ marginRight: '5px' }} /> ENREGISTRER
                    </button>
                    {editingForm && (
                        <button className="btn-secondary" onClick={handleCancelForm}>ANNULER</button>
                    )}
                </div>
            </div>

        </div>
      )}
    </div>
  );
}