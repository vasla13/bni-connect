import { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, query, onSnapshot, doc, runTransaction, increment } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const [withdrawals, setWithdrawals] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Vérification basique d'accès
    if(!auth.currentUser) navigate('/login');

    const q = query(collection(db, "withdrawals"));
    const unsub = onSnapshot(q, (snapshot) => {
      setWithdrawals(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [navigate]);

  const validatePayment = async (req) => {
    if(!window.confirm(`Confirmer le virement de $${req.montant} ?`)) return;
    
    try {
        await runTransaction(db, async (transaction) => {
            const userRef = doc(db, "users", req.userId);
            const reqRef = doc(db, "withdrawals", req.id);

            transaction.delete(reqRef);
            transaction.update(userRef, {
                "economy.gagneTotal": increment(req.montant),
                "economy.statutRetrait": "aucun"
            });
        });
    } catch (e) {
        alert("Erreur: " + e.message);
    }
  };

  return (
    <div style={{padding:'20px'}}>
        <div className="dash-container" style={{margin:'0 auto'}}>
            <div className="dash-header">
                <h2 style={{margin:0}}>ADMINISTRATION <span style={{background:'red', fontSize:'0.7rem', padding:'2px 5px', borderRadius:'3px'}}>SECURE</span></h2>
                <button onClick={() => navigate('/dashboard')} style={{background:'transparent', border:'1px solid #aaa', color:'#aaa', padding:'5px 15px', borderRadius:'20px'}}>
                    Retour Vue User
                </button>
            </div>

            <h3 style={{marginBottom:'20px'}}>Demandes de paiement ({withdrawals.length})</h3>

            {withdrawals.length === 0 && (
                <div style={{textAlign:'center', padding:'40px', color:'#aaa', border:'1px dashed #444', borderRadius:'10px'}}>
                    Aucune demande en attente.
                </div>
            )}

            {withdrawals.map(req => (
                <div key={req.id} className="admin-card">
                    <div style={{display:'flex', gap:'20px', alignItems:'center'}}>
                        {/* Grosse icone Euro verte */}
                        <div className="euro-badge">€</div>
                        
                        <div>
                            <h4 style={{margin:'0 0 5px 0', fontSize:'1.1rem'}}>Paiement pour {req.nomComplet}</h4>
                            <div className="info-row">
                                <span className="icon-box"><i className="fas fa-university"></i></span>
                                <span>Compte: <strong style={{color:'white'}}>{req.compteBancaire}</strong></span>
                            </div>
                            <div className="info-row">
                                <span className="icon-box"><i className="fas fa-phone"></i></span>
                                <span>Tél: {req.tel}</span>
                            </div>
                        </div>
                    </div>

                    <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
                        <div style={{textAlign:'right'}}>
                            <div style={{color:'#aaa', fontSize:'0.8rem'}}>Montant du virement</div>
                            <div className="money-large">${req.montant}</div>
                        </div>
                        <button onClick={() => validatePayment(req)} className="btn-validate">
                            € Payé
                        </button>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
}