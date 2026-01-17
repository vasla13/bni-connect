import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export default function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  const saveUser = async () => {
    if(!selected) return;
    try { await updateDoc(doc(db, "users", selected.id), { info: selected.info }); alert("Sauvegardé !"); } 
    catch(e) { console.error(e); }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
      <div className="pro-card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '70vh' }}>
         <div style={{ padding: '15px', borderBottom: '1px solid #334155' }}>
            <h4 style={{ margin: 0 }}>CITOYENS ({users.length})</h4>
         </div>
         <div style={{ overflowY: 'auto', flex: 1 }}>
            {users.map(u => (
                <div key={u.id} onClick={() => setSelected(u)}
                     style={{ 
                        padding: '12px 15px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)',
                        background: selected?.id === u.id ? 'var(--primary)' : 'transparent',
                        color: selected?.id === u.id ? '#000' : '#fff'
                     }}>
                    <div style={{ fontWeight: 'bold' }}>{u.info.nom} {u.info.prenom}</div>
                </div>
            ))}
         </div>
      </div>

      {selected ? (
          <div className="pro-card">
              <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
                  <div className="avatar" style={{ width: '50px', height: '50px' }}>{selected.info.prenom ? selected.info.prenom[0] : 'U'}</div>
                  <div>
                      <h2 style={{ margin: 0 }}>{selected.info.prenom} {selected.info.nom}</h2>
                      <span className="text-muted" style={{ fontSize: '0.8rem' }}>ID: {selected.id}</span>
                  </div>
              </div>
              <div className="grid-2 mb-4">
                  <div className="input-group"><label>Nom</label><input value={selected.info.nom || ''} onChange={e=>setSelected({...selected, info:{...selected.info, nom:e.target.value}})}/></div>
                  <div className="input-group"><label>Prénom</label><input value={selected.info.prenom || ''} onChange={e=>setSelected({...selected, info:{...selected.info, prenom:e.target.value}})}/></div>
                  <div className="input-group"><label>Banque</label><input value={selected.info.banque || ''} onChange={e=>setSelected({...selected, info:{...selected.info, banque:e.target.value}})}/></div>
                  <div className="input-group"><label>Métier</label><input value={selected.info.metier || ''} onChange={e=>setSelected({...selected, info:{...selected.info, metier:e.target.value}})}/></div>
              </div>
              <button className="btn-main" onClick={saveUser}>SAUVEGARDER MODIFICATIONS</button>
          </div>
      ) : (
          <div className="pro-card flex-center text-muted" style={{ borderStyle: 'dashed' }}>SÉLECTIONNEZ UN DOSSIER</div>
      )}
    </div>
  );
}