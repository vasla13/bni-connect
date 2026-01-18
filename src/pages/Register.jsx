import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Phone, Calendar, CreditCard, ChevronLeft, Save, Loader2, User, UserCircle } from 'lucide-react';
import logo from '../assets/logo.png';

export default function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    prenom: '', nom: '', password: '', 
    banque: '', dateNaissance: '', telephone: '', 
    photoUrl: '', sexe: 'Non précisé', peau: '', cheveux: '', metier: '' 
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 1. Calcul de l'email au moment de l'envoi (Optimisation)
    const formattedPrenom = formData.prenom.trim().toLowerCase().replace(/\s/g, '');
    const formattedNom = formData.nom.trim().toLowerCase().replace(/\s/g, '');
    const generatedEmail = `${formattedPrenom}.${formattedNom}@bni.rp`;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, generatedEmail, formData.password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        info: {
          ...formData,
          email: generatedEmail,
          photoUrl: formData.photoUrl || ""
        },
        economy: { enAttente: 0, gagneTotal: 0, statutRetrait: 'none' },
        game: { dailyCount: 0, lastQuestionDate: null, answers: [] },
        role: 'user',
        createdAt: new Date().toISOString()
      });

      navigate('/dashboard');
    } catch (err) { 
        setError("Erreur : " + err.message); 
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="flex-center" style={{ alignItems: 'start', paddingTop: '4rem' }}>
      <motion.form 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        onSubmit={handleRegister} 
        className="pro-card" 
        style={{ maxWidth: '900px', width: '100%' }}
      >
        {/* EN-TÊTE */}
        <div className="text-center mb-4" style={{ borderBottom: 'var(--border-light)', paddingBottom: '1rem' }}>
            <img src={logo} alt="BNI" className="login-logo" style={{ maxHeight: '60px', marginBottom: '10px' }} />
            <h2 className="text-cyan">NOUVEAU DOSSIER</h2>
            <p className="text-muted">INSCRIPTION CITOYENNE</p>
        </div>

        {error && <div className="alert-box">⚠️ {error}</div>}

        <div className="grid-2">
          
          {/* COLONNE GAUCHE : IDENTITÉ */}
          <div>
            <h4 className="text-warning mb-4" style={{ fontSize: '0.9rem', opacity: 0.8 }}>IDENTITÉ (REQUIS)</h4>
            
            <div className="grid-2" style={{ gap: '10px', marginTop: 0 }}>
                <div className="input-group">
                    <label><User size={14}/> PRÉNOM</label>
                    <input type="text" name="prenom" required onChange={handleChange} placeholder="Jean" />
                </div>
                <div className="input-group">
                    <label><User size={14}/> NOM</label>
                    <input type="text" name="nom" required onChange={handleChange} placeholder="Dupont" />
                </div>
            </div>

            <div className="input-group">
                <label>MOT DE PASSE</label>
                <input type="password" name="password" required onChange={handleChange} placeholder="••••••••" minLength={6} />
            </div>
            
            <div className="grid-2" style={{ gap: '10px', marginTop: 0 }}>
                <div className="input-group">
                    <label><Calendar size={14}/> NAISSANCE</label>
                    <input type="date" name="dateNaissance" required onChange={handleChange} />
                </div>
                <div className="input-group">
                    <label><Phone size={14}/> TÉLÉPHONE</label>
                    <input type="tel" name="telephone" required onChange={handleChange} placeholder="555..." />
                </div>
            </div>
            
            <div className="input-group">
                <label><CreditCard size={14}/> COMPTE BANCAIRE</label>
                <input type="text" name="banque" required placeholder="Numéro de compte" onChange={handleChange} />
            </div>
          </div>

          {/* COLONNE DROITE : PHYSIQUE */}
          <div>
            <h4 className="text-cyan mb-4" style={{ fontSize: '0.9rem', opacity: 0.8 }}>PHYSIQUE & INFO (OPTIONNEL)</h4>
            
            <div className="input-group">
                <label>PHOTO (LIEN URL)</label>
                <input type="url" name="photoUrl" placeholder="https://..." onChange={handleChange} />
            </div>

            <div className="input-group">
                <label><Briefcase size={14}/> MÉTIER</label>
                <input type="text" name="metier" onChange={handleChange} placeholder="Ex: Boulanger" />
            </div>

            <div className="input-group">
                <label><UserCircle size={14}/> SEXE</label>
                <select name="sexe" onChange={handleChange}>
                    <option>Non précisé</option>
                    <option>Homme</option>
                    <option>Femme</option>
                    <option>Autre</option>
                </select>
            </div>

            <div className="grid-2" style={{ gap: '10px', marginTop: 0 }}>
                <div className="input-group"><label>PEAU</label><input type="text" name="peau" onChange={handleChange} /></div>
                <div className="input-group"><label>CHEVEUX</label><input type="text" name="cheveux" onChange={handleChange} /></div>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div style={{ display: 'flex', gap: '15px', marginTop: '2rem', paddingTop: '1.5rem', borderTop: 'var(--border-light)' }}>
            <Link to="/" className="btn-secondary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <ChevronLeft size={18} /> Retour
            </Link>
            <button type="submit" className="btn-main" disabled={loading}>
                {loading ? <Loader2 className="animate-spin"/> : <><Save size={18}/> VALIDER LE DOSSIER</>}
            </button>
        </div>
      </motion.form>
    </div>
  );
}