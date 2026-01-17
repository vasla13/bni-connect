import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
// Si tu n'as pas d'image logo, enlève la ligne import et la balise img plus bas
import logo from '../assets/logo.png'; 

export default function Login() {
  const navigate = useNavigate();
  const [creds, setCreds] = useState({ prenom: '', nom: '', mdp: '' });
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    // Email généré : prenom.nom@bni.rp
    const fakeEmail = `${creds.prenom.trim().toLowerCase().replace(/\s/g,'')}.${creds.nom.trim().toLowerCase().replace(/\s/g,'')}@bni.rp`;

    try {
      const userCred = await signInWithEmailAndPassword(auth, fakeEmail, creds.mdp);
      // Redirection intelligente selon le rôle
      const userDoc = await getDoc(doc(db, "users", userCred.user.uid));
      if (userDoc.exists() && userDoc.data().role === 'admin') navigate('/admin');
      else navigate('/dashboard');
    } catch (err) { setError("Identifiants inconnus ou mot de passe erroné."); }
  };

  return (
    <div className="flex-center">
      <div className="pro-card" style={{ maxWidth: '400px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {/* Si pas de logo, ça ne plantera pas si tu retires l'import */}
          <img src={logo} alt="BNI" style={{ height: '50px', marginBottom: '10px' }} onError={(e) => e.target.style.display='none'} />
          <h2 className="text-cyan">CONNEXION SÉCURISÉE</h2>
          <p className="text-muted">PORTAIL CITOYEN V.4.2</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>PRÉNOM</label>
            <input onChange={e => setCreds({...creds, prenom: e.target.value})} placeholder="Ex: Jean" required />
          </div>
          <div className="input-group">
            <label>NOM</label>
            <input onChange={e => setCreds({...creds, nom: e.target.value})} placeholder="Ex: Dupont" required />
          </div>
          <div className="input-group">
            <label>CODE D'ACCÈS</label>
            <input type="password" onChange={e => setCreds({...creds, mdp: e.target.value})} required />
          </div>

          {error && <div style={{ color: 'var(--danger)', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '4px', marginBottom: '15px', border: '1px solid var(--danger)' }}>⚠ {error}</div>}

          <button type="submit" className="btn-main">ENTRER DANS LE RÉSEAU</button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Créer un dossier numérique</Link>
        </div>
      </div>
    </div>
  );
}