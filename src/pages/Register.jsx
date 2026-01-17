import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  
  // États du formulaire
  const [formData, setFormData] = useState({
    // Obligatoire
    prenom: '', nom: '', email: '', password: '', 
    banque: '', dateNaissance: '', telephone: '', 
    // Optionnel
    photoUrl: '', sexe: 'Non précisé', peau: '', cheveux: '', metier: '' 
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // 1. Création Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Création Document Firestore
      await setDoc(doc(db, "users", user.uid), {
        info: {
          prenom: formData.prenom,
          nom: formData.nom,
          email: formData.email,
          banque: formData.banque,
          dateNaissance: formData.dateNaissance,
          telephone: formData.telephone,
          // Champs optionnels
          photoUrl: formData.photoUrl || "", 
          sexe: formData.sexe,
          peau: formData.peau,
          cheveux: formData.cheveux,
          metier: formData.metier
        },
        economy: { enAttente: 0, gagneTotal: 0, statutRetrait: 'none' },
        game: { dailyCount: 0, lastQuestionDate: null, answers: [] }
      });

      navigate('/dashboard');
    } catch (err) {
      setError("Erreur : " + err.message);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '20px' }}>
      <form onSubmit={handleRegister} className="pro-card" style={{ maxWidth: '1000px', width: '100%' }}>
        <h2 className="text-cyan text-center mb-6">INITIALISATION MATRICULE</h2>
        {error && <p className="text-danger text-center">{error}</p>}

        <div className="grid-2" style={{ alignItems: 'start', gap: '40px' }}>
          
          {/* COLONNE GAUCHE : OBLIGATOIRE */}
          <div>
            <h4 className="text-warning mb-4" style={{ borderBottom: '1px solid var(--warning)', paddingBottom: '10px' }}>IDENTIFICATION (REQUIS)</h4>
            
            <div className="input-group">
              <label>PRÉNOM</label>
              <input type="text" name="prenom" required onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>NOM DE FAMILLE</label>
              <input type="text" name="nom" required onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>EMAIL</label>
              <input type="email" name="email" required onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>MOT DE PASSE</label>
              <input type="password" name="password" required onChange={handleChange} />
            </div>
            <div className="grid-2" style={{ gap: '10px' }}>
                <div className="input-group">
                  <label>DATE NAISSANCE</label>
                  <input type="date" name="dateNaissance" required onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label>TÉLÉPHONE</label>
                  <input type="tel" name="telephone" required onChange={handleChange} />
                </div>
            </div>
            <div className="input-group">
              <label>N° COMPTE BANCAIRE (IBAN)</label>
              <input type="text" name="banque" required placeholder="FR76..." onChange={handleChange} style={{ fontFamily: 'monospace' }} />
            </div>
          </div>

          {/* COLONNE DROITE : OPTIONNEL */}
          <div>
            <h4 className="text-cyan mb-4" style={{ borderBottom: '1px solid var(--primary)', paddingBottom: '10px' }}>BIOMÉTRIE (OPTIONNEL)</h4>
            
            <div className="input-group">
              <label>PHOTO DE PROFIL (LIEN URL)</label>
              <input type="url" name="photoUrl" placeholder="https://image.com/avatar.jpg" onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>MÉTIER / POSTE</label>
              <input type="text" name="metier" onChange={handleChange} />
            </div>
            
            <div className="input-group">
                <label>SEXE</label>
                <select name="sexe" onChange={handleChange}>
                    <option>Non précisé</option>
                    <option>Homme</option>
                    <option>Femme</option>
                    <option>Autre</option>
                </select>
            </div>

            <div className="grid-2" style={{ gap: '10px' }}>
                <div className="input-group">
                    <label>COULEUR PEAU</label>
                    <input type="text" name="peau" onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label>COULEUR CHEVEUX</label>
                  <input type="text" name="cheveux" onChange={handleChange} />
                </div>
            </div>
          </div>

        </div>

        <button type="submit" className="btn-main mt-6" style={{ padding: '20px', fontSize: '1.2rem' }}>CRÉER LE COMPTE</button>
        <p className="text-center mt-4">
          Déjà enregistré ? <Link to="/" className="text-cyan">Connexion au système</Link>
        </p>
      </form>
    </div>
  );
}