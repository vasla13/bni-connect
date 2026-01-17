import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [form, setForm] = useState({
    prenom: '', nom: '', mdp: '', tel: '', metier: '', banque: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    const fakeEmail = `${form.prenom.trim().toLowerCase()}.${form.nom.trim().toLowerCase()}@bni.rp`;

    try {
      const userCred = await createUserWithEmailAndPassword(auth, fakeEmail, form.mdp);
      const user = userCred.user;

      // Structure de données 2035
      await setDoc(doc(db, "users", user.uid), {
        info: {
          prenom: form.prenom,
          nom: form.nom,
          tel: form.tel,
          metier: form.metier,
          banque: form.banque,
          avatar: "https://cdn-icons-png.flaticon.com/512/149/149071.png"
        },
        economy: {
          enAttente: 0,
          gagneTotal: 0,
          statutRetrait: 'aucun'
        },
        game: {
          dailyCount: 0,
          lastQuestionDate: new Date().toLocaleDateString('fr-FR')
        },
        role: 'user',
        createdAt: new Date().toISOString()
      });

      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
        <h2 className="text-cyan tech-font" style={{ marginBottom: '1.5rem' }}>INITIALISATION DU DOSSIER</h2>
        
        <form onSubmit={handleRegister} className="grid-2">
          {/* Identité */}
          <div style={{ gridColumn: '1 / -1' }}>
             <label className="text-muted" style={{ fontSize: '0.7rem' }}>SECTION IDENTITÉ</label>
             <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '5px 0 15px 0' }}/>
          </div>

          <div>
            <input placeholder="Prénom" value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} required />
          </div>
          <div>
            <input placeholder="Nom" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} required />
          </div>

          {/* Contact & Job */}
          <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
             <label className="text-muted" style={{ fontSize: '0.7rem' }}>SECTION PROFESSIONNELLE</label>
             <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '5px 0 15px 0' }}/>
          </div>

          <div>
            <input placeholder="Téléphone (Sim)" value={form.tel} onChange={e => setForm({...form, tel: e.target.value})} required />
          </div>
          <div>
            <input placeholder="Métier / Statut" value={form.metier} onChange={e => setForm({...form, metier: e.target.value})} required />
          </div>

          {/* Finance */}
          <div style={{ gridColumn: '1 / -1' }}>
            <input placeholder="Compte Bancaire (IBAN/Rib)" value={form.banque} onChange={e => setForm({...form, banque: e.target.value})} required />
          </div>

          {/* Sécurité */}
          <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
            <input type="password" placeholder="Définir Code d'Accès" value={form.mdp} onChange={e => setForm({...form, mdp: e.target.value})} required />
          </div>

          <div style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'TRAITEMENT EN COURS...' : 'VALIDER LE DOSSIER'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Link to="/" className="text-muted" style={{ fontSize: '0.9rem', textDecoration: 'none' }}>
            ← Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}