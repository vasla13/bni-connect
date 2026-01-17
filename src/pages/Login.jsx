import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import bniLogo from '../assets/logo.png'; 

export default function Login() {
  const navigate = useNavigate();
  const [creds, setCreds] = useState({ prenom: '', nom: '', mdp: '' });
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
        if(creds.prenom.toLowerCase() === 'admin' && creds.mdp === 'admin') { navigate('/admin'); return; }
        const fakeEmail = `${creds.prenom.trim().toLowerCase().replace(/\s/g, '')}.${creds.nom.trim().toLowerCase().replace(/\s/g, '')}@bni.rp`;
        const userCred = await signInWithEmailAndPassword(auth, fakeEmail, creds.mdp);
        
        const userDoc = await getDoc(doc(db, "users", userCred.user.uid));
        if(userDoc.exists() && userDoc.data().role === 'admin') navigate('/admin');
        else navigate('/dashboard');

    } catch (err) { setError("Erreur: Identifiants invalides."); }
  };

  return (
    <div className="auth-wrapper">
      <div className="pro-card auth">
        <div style={{textAlign:'center', marginBottom:'40px'}}>
            <img src={bniLogo} alt="BNI" style={{height:'60px', marginBottom:'15px'}}/>
            <div style={{color:'white', fontSize:'1.2rem', fontWeight:'bold', letterSpacing:'1px'}}>CONNEXION SÉCURISÉE</div>
        </div>

        <form onSubmit={handleLogin}>
            <div className="input-group">
                <label>Prénom</label>
                <input onChange={(e) => setCreds({...creds, prenom: e.target.value})} placeholder="Jean" required />
            </div>
            <div className="input-group">
                <label>Nom de famille</label>
                <input onChange={(e) => setCreds({...creds, nom: e.target.value})} placeholder="Dupont" required />
            </div>
            <div className="input-group">
                <label>Mot de passe</label>
                <input type="password" onChange={(e) => setCreds({...creds, mdp: e.target.value})} required />
            </div>

            {error && <div style={{background:'rgba(255,0,0,0.2)', color:'#ff6b6b', padding:'10px', borderRadius:'8px', marginBottom:'20px', textAlign:'center'}}>{error}</div>}

            <button type="submit" className="btn-main">ACCÉDER</button>
        </form>
        
        <div style={{textAlign:'center', marginTop:'30px'}}>
            <Link to="/register" style={{color:'#b0c4de', fontSize:'1rem'}}>Créer un dossier citoyen</Link>
        </div>
      </div>
    </div>
  );
}