import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import logo from '../assets/logo.png';

export default function Login() {
  const navigate = useNavigate();
  const [creds, setCreds] = useState({ prenom: '', nom: '', mdp: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formattedPrenom = creds.prenom.trim().toLowerCase().replace(/\s/g, '');
    const formattedNom = creds.nom.trim().toLowerCase().replace(/\s/g, '');
    const fakeEmail = `${formattedPrenom}.${formattedNom}@bni.rp`;

    try {
      const userCred = await signInWithEmailAndPassword(auth, fakeEmail, creds.mdp);
      const userDoc = await getDoc(doc(db, "users", userCred.user.uid));
      
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError("Identité non reconnue ou code d'accès invalide.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pro-card" 
        style={{ maxWidth: '420px', width: '100%' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          {/* CORRECTION LOGO : Taille max et object-fit pour éviter la coupure */}
          <motion.img 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            src={logo} 
            alt="BNI" 
            style={{ 
              maxWidth: '180px',    // Largeur max pour ne pas déborder
              maxHeight: '80px',    // Hauteur max pour ne pas être géant
              width: 'auto',        // Garde les proportions
              height: 'auto',
              marginBottom: '15px', 
              objectFit: 'contain'  // Empêche l'image d'être coupée
            }} 
            onError={(e) => e.target.style.display='none'} 
          />
          <h2 className="text-cyan" style={{ fontSize: '1.8rem', marginBottom: '0.2rem' }}>IDENTIFICATION</h2>
          <p className="text-muted" style={{ letterSpacing: '1px', fontSize: '0.8rem' }}>PORTAIL CITOYEN V.4.2</p>
        </div>

        <form onSubmit={handleLogin}>
          
          <div className="input-group">
            <label className="flex items-center gap-2"><User size={14} className="text-primary"/> PRÉNOM</label>
            <input 
              onChange={e => setCreds({...creds, prenom: e.target.value})} 
              placeholder="Ex: Jean" 
              required 
            />
          </div>

          <div className="input-group">
            <label className="flex items-center gap-2"><User size={14} className="text-primary"/> NOM</label>
            <input 
              onChange={e => setCreds({...creds, nom: e.target.value})} 
              placeholder="Ex: Dupont" 
              required 
            />
          </div>

          <div className="input-group">
            <label className="flex items-center gap-2"><Lock size={14} className="text-primary"/> CODE D'ACCÈS</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                onChange={e => setCreds({...creds, mdp: e.target.value})} 
                required 
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none', boxShadow: 'none', padding: 0, color: 'rgba(255,255,255,0.5)', cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ color: '#fca5a5', background: 'rgba(239,68,68,0.15)', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(239,68,68,0.3)', fontSize: '0.9rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span>⚠</span> {error}
            </div>
          )}

          <button type="submit" className="btn-main" disabled={loading} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : <>ENTRER DANS LE RÉSEAU <ArrowRight size={18} /></>}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            Créer un dossier numérique <ArrowRight size={14}/>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}