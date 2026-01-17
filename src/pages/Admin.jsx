import { useEffect, useState } from 'react';
import { db, functions, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Users, Wallet } from 'lucide-react'; // Icônes

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('withdrawals'); // 'withdrawals' ou 'users'
  const [withdrawals, setWithdrawals] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) navigate('/login');

    // 1. Écouter les Virements
    const qWithdrawals = query(collection(db, "withdrawals"), orderBy("date", "desc"));
    const unsubWithdrawals = onSnapshot(qWithdrawals, (snapshot) => {
      setWithdrawals(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 2. Écouter les Utilisateurs (Citoyens)
    const qUsers = query(collection(db, "users"));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubWithdrawals(); unsubUsers(); };
  }, [navigate]);

  const handleAction = async (id, action) => {
    if (!confirm(action === 'approve' ? "Valider ce virement ?" : "Refuser ce virement ?")) return;
    setLoading(true);
    try {
      const manageWithdrawal = httpsCallable(functions, 'manageWithdrawal');
      await manageWithdrawal({ withdrawalId: id, action });
    } catch (error) {
      alert("Erreur : " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <div className="pro-card" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>🛡️ ADMINISTRATION</h2>
        <button className="btn-secondary" onClick={() => navigate('/dashboard')}>RETOUR DASHBOARD</button>
      </div>

      {/* BARRE D'ONGLETS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          className={activeTab === 'withdrawals' ? 'btn-main' : 'btn-secondary'}
          onClick={() => setActiveTab('withdrawals')}
          style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
        >
          <Wallet size={18} /> DEMANDES DE VIREMENT
        </button>
        <button 
          className={activeTab === 'users' ? 'btn-main' : 'btn-secondary'}
          onClick={() => setActiveTab('users')}
          style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
        >
          <Users size={18} /> LISTE DES CITOYENS
        </button>
      </div>

      <div className="pro-card">
        
        {/* VUE 1 : VIREMENTS */}
        {activeTab === 'withdrawals' && (
          <div>
             <h3 className="text-cyan">EN ATTENTE DE VALIDATION</h3>
             {withdrawals.length === 0 ? <p>Aucune demande.</p> : (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                 {withdrawals.map((w) => {
                   const isPending = !w.statut || w.statut === 'pending';
                   return (
                     <div key={w.id} style={{ 
                       background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px',
                       borderLeft: isPending ? '4px solid var(--warning)' : (w.statut === 'approved' ? '4px solid var(--success)' : '4px solid var(--danger)')
                     }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                         <div>
                           <div style={{ fontWeight: 'bold' }}>{w.nomComplet}</div>
                           <div className="text-muted">{w.tel} • {w.compteBancaire || 'Non renseigné'}</div>
                         </div>
                         <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.2rem' }}>{w.montant} $</div>
                       </div>
                       {isPending && (
                         <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                           <button disabled={loading} onClick={() => handleAction(w.id, 'approve')} className="btn-success" style={{ flex: 1, background: 'var(--success)', border: 'none', padding: '5px', cursor: 'pointer' }}>✅ VALIDER</button>
                           <button disabled={loading} onClick={() => handleAction(w.id, 'reject')} className="btn-danger" style={{ flex: 1, background: 'var(--danger)', border: 'none', padding: '5px', cursor: 'pointer' }}>❌ REFUSER</button>
                         </div>
                       )}
                     </div>
                   );
                 })}
               </div>
             )}
          </div>
        )}

        {/* VUE 2 : LISTE DES CITOYENS */}
        {activeTab === 'users' && (
          <div>
            <h3 className="text-cyan">ANNUAIRE DES CITOYENS ({users.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {users.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px' }}>
                  <img src={u.info?.avatar} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} alt="Avatar" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold' }}>{u.info?.prenom} {u.info?.nom}</div>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>{u.info?.metier} • {u.info?.tel}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--success)', fontWeight: 'bold' }}>{u.economy?.gagneTotal || 0} $</div>
                    <div style={{ fontSize: '0.7rem', color: '#aaa' }}>Gagnés au total</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}