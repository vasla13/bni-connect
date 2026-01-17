import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, runTransaction } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const [withdrawals, setWithdrawals] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Sécurité basique
    if (!auth.currentUser) return navigate('/');

    const unsub = onSnapshot(collection(db, "withdrawals"), (snapshot) => {
      setWithdrawals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsub();
  }, [navigate]);

  const handlePay = async (item) => {
    if(!window.confirm(`Confirmer le virement de ${item.montant}$ pour ${item.nomComplet} ?`)) return;

    try {
      await runTransaction(db, async (transaction) => {
        // 1. Lire le user
        const userRef = doc(db, "users", item.userId);
        const userSnap = await transaction.get(userRef);
        
        if (!userSnap.exists()) throw "User n'existe pas";

        const userData = userSnap.data();
        const currentEnAttente = userData.economy.enAttente || 0;
        const currentGagne = userData.economy.gagneTotal || 0;

        // 2. Mettre à jour l'économie
        // On soustrait le montant de "enAttente" et on l'ajoute à "gagneTotal"
        // Note: Si le joueur a farmé entre temps, on ne remet pas à 0, on soustrait juste le montant payé.
        const newEnAttente = currentEnAttente >= item.montant ? currentEnAttente - item.montant : 0;
        
        transaction.update(userRef, {
          "economy.enAttente": newEnAttente,
          "economy.gagneTotal": currentGagne + item.montant,
          "economy.statutRetrait": "aucun"
        });

        // 3. Supprimer la demande
        transaction.delete(doc(db, "withdrawals", item.id));
      });
      
    } catch (e) {
      console.error(e);
      alert("Erreur transaction: " + e);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="text-cyan">PANNEAU SUPERVISION BNI</h1>
        <button className="btn-secondary" onClick={() => navigate('/dashboard')}>RETOUR DASHBOARD</button>
      </header>

      <div className="glass-panel" style={{ padding: '1rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-main)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--primary)', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>DATE</th>
              <th style={{ padding: '1rem' }}>CITOYEN</th>
              <th style={{ padding: '1rem' }}>COMPTE CIBLE</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>MONTANT</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  AUCUNE TRANSACTION EN ATTENTE
                </td>
              </tr>
            ) : (
              withdrawals.map(w => (
                <tr key={w.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{new Date(w.date).toLocaleDateString()} {new Date(w.date).toLocaleTimeString()}</td>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{w.nomComplet}</td>
                  <td style={{ padding: '1rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{w.compteBancaire}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    {w.montant} $
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <button className="btn-primary" style={{ padding: '5px 15px', fontSize: '0.8rem' }} onClick={() => handlePay(w)}>
                      AUTORISER VIREMENT
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}