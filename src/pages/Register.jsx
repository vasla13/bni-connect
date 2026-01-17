import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();
  // State séparé pour la clarté
  const [req, setReq] = useState({ prenom: '', nom: '', banque: '', dob: '', tel: '', mdp: '' });
  const [opt, setOpt] = useState({ avatar: '', sexe: '', peau: '', cheveux: '', metier: '' });

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const fakeEmail = `${req.prenom.trim().toLowerCase().replace(/\s/g,'')}.${req.nom.trim().toLowerCase().replace(/\s/g,'')}@bni.rp`;
      
      // Avatar par défaut si vide
      const finalAvatar = opt.avatar.trim() || `https://ui-avatars.com/api/?name=${req.prenom}+${req.nom}&background=0ea5e9&color=fff&size=128`;

      const userCred = await createUserWithEmailAndPassword(auth, fakeEmail, req.mdp);
      
      // Création document utilisateur complet
      await setDoc(doc(db, "users", userCred.user.uid), {
        info: { ...req, ...opt, avatar: finalAvatar },
        economy: { enAttente: 0, gagneTotal: 0, statutRetrait: 'aucun' },
        game: { dailyCount: 0, lastQuestionDate: new Date().toLocaleDateString('fr-FR'), answers: [] },
        role: 'user',
        createdAt: new Date().toISOString()
      });
      navigate('/dashboard');
    } catch (err) { alert("Erreur système: " + err.message); }
  };

  return (
    <div className="flex-center" style={{ alignItems: 'flex-start', paddingTop: '50px', paddingBottom: '50px' }}>
      <div className="pro-card" style={{ width: '100%', maxWidth: '900px' }}>
        <h2 style={{ textAlign: 'center', color: 'var(--primary)', marginBottom: '30px' }}>NOUVELLE IDENTITÉ</h2>
        
        <form onSubmit={handleRegister} className="grid-2">
          
          {/* COLONNE GAUCHE (Requis) */}
          <div>
            <h4 style={{ color: 'var(--danger)', borderBottom: '1px solid var(--danger)', paddingBottom: '10px' }}>REQUIS *</h4>
            <div style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input placeholder="Prénom *" value={req.prenom} onChange={e => setReq({...req, prenom: e.target.value})} required />
                <input placeholder="Nom *" value={req.nom} onChange={e => setReq({...req, nom: e.target.value})} required />
              </div>
              <input type="date" placeholder="Date Naissance *" value={req.dob} onChange={e => setReq({...req, dob: e.target.value})} required style={{ colorScheme: 'dark' }} />
              <input placeholder="Téléphone *" value={req.tel} onChange={e => setReq({...req, tel: e.target.value})} required />
              <input placeholder="IBAN Bancaire *" value={req.banque} onChange={e => setReq({...req, banque: e.target.value})} required />
              <input type="password" placeholder="Mot de Passe *" value={req.mdp} onChange={e => setReq({...req, mdp: e.target.value})} required />
            </div>
          </div>

          {/* COLONNE DROITE (Facultatif) */}
          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '30px' }}>
            <h4 style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--text-muted)', paddingBottom: '10px' }}>FACULTATIF</h4>
            <div style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
              <input placeholder="URL Avatar (Image)" value={opt.avatar} onChange={e => setOpt({...opt, avatar: e.target.value})} />
              <input placeholder="Métier" value={opt.metier} onChange={e => setOpt({...opt, metier: e.target.value})} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input placeholder="Sexe" value={opt.sexe} onChange={e => setOpt({...opt, sexe: e.target.value})} />
                <input placeholder="Peau" value={opt.peau} onChange={e => setOpt({...opt, peau: e.target.value})} />
              </div>
              <input placeholder="Cheveux" value={opt.cheveux} onChange={e => setOpt({...opt, cheveux: e.target.value})} />
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1', marginTop: '30px' }}>
            <button type="submit" className="btn-main">VALIDER L'INSCRIPTION</button>
            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Annuler</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}