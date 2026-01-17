import { useState, useEffect } from 'react';
import { db, functions } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { CreditCard, Check } from 'lucide-react';

export default function PaymentsPanel() {
  const [withdrawals, setWithdrawals] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "withdrawals"), where("statut", "==", "pending"));
    const unsub = onSnapshot(q, (snap) => setWithdrawals(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  const handleValidate = async (id) => {
    if(!window.confirm("Valider ce virement ?")) return;
    try {
      const manage = httpsCallable(functions, 'manageWithdrawal');
      await manage({ withdrawalId: id, action: 'approve' });
    } catch (e) { alert(e.message); }
  };

  if(withdrawals.length === 0) return <div className="pro-card text-muted text-center">AUCUNE DEMANDE EN ATTENTE</div>;

  return (
    <div className="grid-2">
      {withdrawals.map(w => (
        <div key={w.id} className="pro-card" style={{ borderLeft: '4px solid var(--warning)' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                  <h3 className="text-warning" style={{ margin: 0, fontSize: '1.1rem' }}>{w.montant} $</h3>
                  <div style={{ fontSize: '0.9rem', color: '#fff' }}>{w.nomComplet}</div>
              </div>
              <CreditCard size={20} className="text-muted" />
           </div>
           <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.85rem', marginBottom: '1rem', wordBreak: 'break-all' }}>
              {w.banque}
           </div>
           <button className="btn-main w-full" onClick={() => handleValidate(w.id)}>
              <Check size={18} style={{ marginRight: '8px' }}/> VALIDER
           </button>
        </div>
      ))}
    </div>
  );
}