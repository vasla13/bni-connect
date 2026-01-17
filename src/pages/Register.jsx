import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  // Champs obligatoires
  const [req, setReq] = useState({ prenom: '', nom: '', banque: '', dob: '', tel: '', mdp: '' });
  // Champs optionnels
  const [opt, setOpt] = useState({ avatar: '', sexe: '', peau: '', cheveux: '', metier: '' });
  
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Email fictif
    const fakeEmail = `${req.prenom.trim().toLowerCase()}.${req.nom.trim().toLowerCase()}@bni.rp`;
    
    // Logique Avatar : Si vide -> API UI Avatars avec les initiales
    const finalAvatar = opt.avatar.trim() !== '' 
      ? opt.avatar 
      : `https://ui-avatars.com/api/?name=${req.prenom}+${req.nom}&background=00f0ff&color=000&size=128`;

    try {
      const userCred = await createUserWithEmailAndPassword(auth, fakeEmail, req.mdp);
      const user = userCred.user;

      await setDoc(doc(db, "users", user.uid), {
        info: {
          prenom: req.prenom,
          nom: req.nom,
          banque: req.banque,
          dob: req.dob,
          tel: req.tel,
          // Optionnels
          avatar: finalAvatar,
          sexe: opt.sexe || 'Non spécifié',
          peau: opt.peau || 'Non spécifié',
          cheveux: opt.cheveux || 'Non spécifié',
          metier: opt.metier || 'Sans emploi'
        },
        economy: {
          enAttente: 0,
          gagneTotal: 0,
          statutRetrait: 'aucun' // aucun, waiting
        },
        game: {
          dailyCount: 0,
          lastQuestionDate: new Date().toLocaleDateString('fr-FR'),
          answers: [] // Pour stocker les réponses sensibles
        },
        role: 'user',
        createdAt: new Date().toISOString()
      });

      navigate('/dashboard');
    } catch (err) {
      alert("Erreur: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '900px', padding: '2rem' }}>
        <h2 className="text-cyan tech-font" style={{ marginBottom: '2rem', textAlign: 'center' }}>NOUVEAU MATRICULE CITOYEN</h2>
        
        <form onSubmit={handleRegister}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            
            {/* GAUCHE : OBLIGATOIRE */}
            <div>
              <h4 className="text-danger" style={{ borderBottom: '1px solid var(--danger)', paddingBottom: '5px' }}>REQUIS *</h4>
              <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                <input placeholder="Prénom *" value={req.prenom} onChange={e => setReq({...req, prenom: e.target.value})} required />
                <input placeholder="Nom *" value={req.nom} onChange={e => setReq({...req, nom: e.target.value})} required />
                <input placeholder="Date de Naissance *" type="date" value={req.dob} onChange={e => setReq({...req, dob: e.target.value})} required style={{colorScheme:'dark'}} />
                <input placeholder="N° Téléphone *" value={req.tel} onChange={e => setReq({...req, tel: e.target.value})} required />
                <input placeholder="Compte Bancaire (IBAN) *" value={req.banque} onChange={e => setReq({...req, banque: e.target.value})} required />
                <input type="password" placeholder="Mot de Passe *" value={req.mdp} onChange={e => setReq({...req, mdp: e.target.value})} required />
              </div>
            </div>

            {/* DROITE : OPTIONNEL */}
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '2rem' }}>
              <h4 className="text-muted" style={{ borderBottom: '1px solid var(--text-muted)', paddingBottom: '5px' }}>FACULTATIF</h4>
              <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                <input placeholder="Lien Photo Profil (URL)" value={opt.avatar} onChange={e => setOpt({...opt, avatar: e.target.value})} />
                <input placeholder="Sexe (H/F/Autre)" value={opt.sexe} onChange={e => setOpt({...opt, sexe: e.target.value})} />
                <input placeholder="Couleur de Peau" value={opt.peau} onChange={e => setOpt({...opt, peau: e.target.value})} />
                <input placeholder="Couleur Cheveux" value={opt.cheveux} onChange={e => setOpt({...opt, cheveux: e.target.value})} />
                <input placeholder="Métier Actuel" value={opt.metier} onChange={e => setOpt({...opt, metier: e.target.value})} />
              </div>
            </div>

          </div>

          <div style={{ marginTop: '2rem' }}>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'INITIALISATION...' : 'ENREGISTRER LE CITOYEN'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
               <Link to="/" className="text-muted">Annuler</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}