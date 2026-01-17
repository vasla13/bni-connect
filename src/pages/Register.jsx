import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import bniLogo from '../assets/logo.png';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    prenom: '', nom: '', banque: '', dob: '', tel: '', mdp: '',
    avatar: '', sexe: '', peau: '', cheveux: '', metier: ''
  });
  const [modal, setModal] = useState({ show: false, msg: '' });

  const handleChange = (e) => setForm({...form, [e.target.name]: e.target.value});

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const fakeEmail = `${form.prenom.trim().toLowerCase().replace(/\s/g, '')}.${form.nom.trim().toLowerCase().replace(/\s/g, '')}@bni.rp`;
      const userCred = await createUserWithEmailAndPassword(auth, fakeEmail, form.mdp);
      await setDoc(doc(db, "users", userCred.user.uid), {
        info: { ...form },
        economy: { enAttente: 0, gagneTotal: 0, statutRetrait: 'aucun' },
        game: { dailyCount: 0, lastQuestionDate: null },
        role: 'user'
      });
      navigate('/dashboard');
    } catch (err) { setModal({ show: true, msg: err.message }); }
  };

  return (
    <div className="auth-wrapper">
      {modal.show && (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Erreur</h3><p>{modal.msg}</p>
                <button className="btn-cancel" onClick={() => setModal({show:false})}>Fermer</button>
            </div>
        </div>
      )}

      <div className="pro-card wide">
        <div style={{textAlign:'center', marginBottom:'30px', borderBottom:'1px solid rgba(255,255,255,0.1)', paddingBottom:'20px'}}>
             <img src={bniLogo} alt="BNI" style={{height:'40px'}}/>
             <div style={{color:'#00b4d8', fontSize:'1rem', letterSpacing:'2px', marginTop:'5px', fontWeight:'bold'}}>OUVERTURE DE DOSSIER</div>
        </div>

        <form onSubmit={handleRegister} style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(350px, 1fr))', gap:'40px'}}>
            <div>
                <h4 style={{color:'white', marginTop:0, marginBottom:'20px', borderLeft:'3px solid #00b4d8', paddingLeft:'10px'}}>IDENTITÉ</h4>
                <div style={{display:'flex', gap:'15px'}}>
                    <div className="input-group"><label>Prénom</label><input name="prenom" required onChange={handleChange}/></div>
                    <div className="input-group"><label>Nom</label><input name="nom" required onChange={handleChange}/></div>
                </div>
                <div className="input-group"><label>Date de Naissance</label><input type="date" name="dob" required onChange={handleChange}/></div>
                <div className="input-group"><label>Compte Bancaire</label><input name="banque" required onChange={handleChange}/></div>
            </div>

            <div>
                <h4 style={{color:'white', marginTop:0, marginBottom:'20px', borderLeft:'3px solid #00b4d8', paddingLeft:'10px'}}>SÉCURITÉ</h4>
                <div className="input-group"><label>Téléphone</label><input name="tel" required onChange={handleChange}/></div>
                <div className="input-group"><label>Mot de passe</label><input type="password" name="mdp" required onChange={handleChange}/></div>
                <div className="input-group"><label>Métier</label><input name="metier" onChange={handleChange}/></div>
                <div className="input-group"><label>Photo URL</label><input name="avatar" onChange={handleChange}/></div>
            </div>
            
            <div style={{gridColumn:'1 / -1', marginTop:'20px'}}>
                <button type="submit" className="btn-main">VALIDER L'INSCRIPTION</button>
                <div style={{textAlign:'center', marginTop:'20px'}}>
                    <Link to="/login" style={{color:'#b0c4de'}}>Annuler</Link>
                </div>
            </div>
        </form>
      </div>
    </div>
  );
}