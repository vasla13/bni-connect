import { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Phone, Calendar, CreditCard, ChevronLeft, Save, Loader2 } from 'lucide-react';
// IMPORT DU LOGO
import logo from '../assets/logo.png';

export default function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    prenom: '', nom: '', email: '', password: '', 
    banque: '', dateNaissance: '', telephone: '', 
    photoUrl: '', sexe: 'Non précisé', peau: '', cheveux: '', metier: '' 
  });

  // Calcul auto de l'email (invisible pour l'utilisateur)
  useEffect(() => {
    if(formData.prenom && formData.nom) {
        const p = formData.prenom.trim().toLowerCase().replace(/\s/g, '');
        const n = formData.nom.trim().toLowerCase().replace(/\s/g, '');
        setFormData(prev => ({ ...prev, email: `${p}.${n}@bni.rp` }));
    }
  }, [formData.prenom, formData.nom]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // L'email est utilisé ici même s'il n'est pas affiché
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        info: {
          prenom: formData.prenom, nom: formData.nom, email: formData.email,
          banque: formData.banque, dateNaissance: formData.dateNaissance, telephone: formData.telephone,
          photoUrl: formData.photoUrl || "", sexe: formData.sexe,
          peau: formData.peau, cheveux: formData.cheveux, metier: formData.metier
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
    <div className="flex-center" style={{ minHeight: '100vh', padding: '20px', alignItems: 'start' }}>
      <motion.form 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        onSubmit={handleRegister} 
        className="pro-card" 
        style={{ maxWidth: '900px', width: '100%', marginTop: '20px' }}
      >
        {/* EN-TÊTE CENTRÉ AVEC LOGO */}
        <div style={{ marginBottom: '2rem', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
            <motion.img 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              src={logo} 
              alt="BNI" 
              style={{ 
                maxWidth: '150px',
                maxHeight: '70px',
                width: 'auto',
                height: 'auto',
                marginBottom: '15px', 
                objectFit: 'contain',
                display: 'inline-block' // Important pour le centrage
              }} 
              onError={(e) => e.target.style.display='none'} 
            />
            <h2 className="text-cyan" style={{ margin: 0, fontSize: '1.8rem' }}>NOUVEAU DOSSIER</h2>
            <p className="text-muted" style={{ letterSpacing: '1px', fontSize: '0.9rem' }}>INSCRIPTION CITOYENNE</p>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5', padding: '10px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(239,68,68,0.4)' }}>{error}</div>}

        <div className="grid-2">
          
          {/* GAUCHE */}
          <div>
            <h4 className="text-warning mb-4" style={{ fontSize: '0.9rem', opacity: 0.8 }}>IDENTITÉ (REQUIS)</h4>
            
            <div className="grid-2" style={{ gap: '10px', marginBottom: '0' }}>
                <div className="input-group">
                    <label>PRÉNOM</label>
                    <input type="text" name="prenom" required onChange={handleChange} placeholder="Jean" />
                </div>
                <div className="input-group">
                    <label>NOM</label>
                    <input type="text" name="nom" required onChange={handleChange} placeholder="Dupont" />
                </div>
            </div>

            <div className="input-group">
                <label>MOT DE PASSE</label>
                <input type="password" name="password" required onChange={handleChange} placeholder="••••••••" minLength={6} />
            </div>
            
            <div className="grid-2" style={{ gap: '10px' }}>
                <div className="input-group">
                    <label><Calendar size={12} style={{marginRight:4}}/>NAISSANCE</label>
                    <input type="date" name="dateNaissance" required onChange={handleChange} />
                </div>
                <div className="input-group">
                    <label><Phone size={12} style={{marginRight:4}}/>TÉLÉPHONE</label>
                    <input type="tel" name="telephone" required onChange={handleChange} placeholder="555..." />
                </div>
            </div>
            
            <div className="input-group">
                <label><CreditCard size={12} style={{marginRight:4}}/>NUMÉRO DE COMPTE BANCAIRE</label>
                <input type="text" name="banque" required placeholder="" onChange={handleChange} />
            </div>
          </div>

          {/* DROITE */}
          <div>
            <h4 className="text-cyan mb-4" style={{ fontSize: '0.9rem', opacity: 0.8 }}>PHYSIQUE & INFO (OPTIONNEL)</h4>
            
            <div className="input-group">
                <label>PHOTO (LIEN URL)</label>
                <input type="url" name="photoUrl" placeholder="https://..." onChange={handleChange} />
            </div>

            <div className="input-group">
                <label><Briefcase size={12} style={{marginRight:4}}/>MÉTIER</label>
                <input type="text" name="metier" onChange={handleChange} placeholder="Ex: Boulanger" />
            </div>

            <div className="input-group">
                <label>SEXE</label>
                <select 
                  name="sexe" 
                  onChange={handleChange} 
                  style={{ 
                    width: '100%', 
                    padding: '14px 16px',
                    background: 'rgba(255,255,255,0.045)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    borderRadius: '14px',
                    color: 'var(--text-main)',
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                    <option style={{ background: '#020617', color: 'white' }}>Non précisé</option>
                    <option style={{ background: '#020617', color: 'white' }}>Homme</option>
                    <option style={{ background: '#020617', color: 'white' }}>Femme</option>
                    <option style={{ background: '#020617', color: 'white' }}>Autre</option>
                </select>
            </div>

            <div className="grid-2" style={{ gap: '10px' }}>
                <div className="input-group"><label>PEAU</label><input type="text" name="peau" onChange={handleChange} /></div>
                <div className="input-group"><label>CHEVEUX</label><input type="text" name="cheveux" onChange={handleChange} /></div>
            </div>
          </div>

        </div>

        <div style={{ display: 'flex', gap: '15px', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <Link to="/" className="btn-secondary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <ChevronLeft size={18} /> Retour
            </Link>
            <button type="submit" className="btn-main" disabled={loading} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                {loading ? <Loader2 className="animate-spin"/> : <><Save size={18}/> VALIDER LE DOSSIER</>}
            </button>
        </div>
      </motion.form>
    </div>
  );
}