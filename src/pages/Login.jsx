import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase'; // Assure-toi que le chemin est bon
import { useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';

export default function Login() {
  const [creds, setCreds] = useState({ prenom: '', nom: '', mdp: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Reconstitution de l'email fictif "corpo"
    const email = `${creds.prenom.trim().toLowerCase()}.${creds.nom.trim().toLowerCase()}@bni.rp`;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, creds.mdp);
      const user = userCredential.user;

      // Vérification du rôle via Firestore (plus sécurisé)
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        // Fallback si pas de doc (ne devrait pas arriver)
        navigate('/dashboard');
      }

    } catch (err) {
      console.error(err);
      setError("Identification échouée. Vérifiez vos accréditations.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', position: 'relative' }}>
        
        {/* Effet décoratif en haut à gauche */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '30px', height: '30px', borderTop: '2px solid var(--primary)', borderLeft: '2px solid var(--primary)' }}></div>

        <h2 className="text-cyan" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>BNI CONNECT</h2>
        <p className="text-muted" style={{ textAlign: 'center', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Portail d'Accès Sécurisé v.4.0
        </p>

        {error && (
          <div style={{ background: 'rgba(255, 42, 42, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '10px', borderRadius: '4px', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'center' }}>
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="text-muted" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>IDENTIFIANT (PRÉNOM)</label>
            <input 
              type="text" 
              placeholder="Ex: John"
              value={creds.prenom}
              onChange={(e) => setCreds({...creds, prenom: e.target.value})}
              required 
            />
          </div>

          <div className="mb-4">
            <label className="text-muted" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>IDENTIFIANT (NOM)</label>
            <input 
              type="text" 
              placeholder="Ex: Doe"
              value={creds.nom}
              onChange={(e) => setCreds({...creds, nom: e.target.value})}
              required 
            />
          </div>

          <div className="mb-4">
            <label className="text-muted" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>CODE D'ACCÈS</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={creds.mdp}
              onChange={(e) => setCreds({...creds, mdp: e.target.value})}
              required 
            />
          </div>

          <button type="submit" className="btn-primary w-full mt-4" disabled={loading}>
            {loading ? <span className="loader" style={{ display: 'inline-block', width: '14px', height: '14px' }}></span> : 'CONNEXION SYSTÈME'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
          <p className="text-muted" style={{ fontSize: '0.8rem' }}>Nouveau citoyen ?</p>
          <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>
            CRÉER UN DOSSIER NUMÉRIQUE
          </Link>
        </div>

      </div>
      
      <p style={{ marginTop: '2rem', color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem' }}>
        BNI CORP © 2035 - Tous droits réservés. Connexion sécurisée par NeuralLink™
      </p>
    </div>
  );
}