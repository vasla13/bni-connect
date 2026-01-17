import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, increment, addDoc, collection } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import bniLogo from '../assets/logo.png';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const [modal, setModal] = useState({ show: false, title: '', msg: '', onConfirm: null });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (u) {
        const d = await getDoc(doc(db, "users", u.uid));
        if (d.exists()) {
            const userData = { uid: u.uid, ...d.data() };
            setUser(userData); setEditForm(userData.info);
        }
      } else { navigate('/login'); }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleActivity = () => {
     if(!user) return;
     const today = new Date().toLocaleDateString('fr-FR');
     if (user.game.lastQuestionDate === today && user.game.dailyCount >= 5) { 
        setModal({ show: true, title: "Limite Atteinte", msg: "Quota journalier atteint." });
        return; 
     }
     setModal({ 
        show: true, title: "Activité", msg: "Confirmer l'action pour +50$ ?", 
        onConfirm: async () => {
            const isNewDay = user.game.lastQuestionDate !== today;
            await updateDoc(doc(db, "users", user.uid), {
                "economy.enAttente": increment(50),
                "game.lastQuestionDate": today,
                "game.dailyCount": isNewDay ? 1 : increment(1)
            });
            window.location.reload();
        }
     });
  };

  const handleWithdraw = () => {
     if(user.economy.enAttente < 2000) return;
     setModal({
        show: true, title: "Virement", msg: `Transférer $${user.economy.enAttente} vers le compte ${user.info.banque} ?`,
        onConfirm: async () => {
            await addDoc(collection(db, "withdrawals"), {
                userId: user.uid,
                nomComplet: `${user.info.prenom} ${user.info.nom}`,
                compteBancaire: user.info.banque,
                tel: user.info.tel,
                montant: user.economy.enAttente,
                date: new Date().toISOString()
            });
            await updateDoc(doc(db, "users", user.uid), { "economy.enAttente": 0, "economy.statutRetrait": "waiting" });
            window.location.reload();
        }
     });
  };

  const saveProfile = async () => {
      try {
          await updateDoc(doc(db, "users", user.uid), { "info": editForm });
          setIsEditing(false); window.location.reload();
      } catch (e) { alert(e.message); }
  };

  if (!user) return <div style={{height:'100vh', display:'flex', justifyContent:'center', alignItems:'center'}}>Chargement...</div>;

  const progressPercent = Math.min((user.economy.enAttente / 2000) * 100, 100);

  return (
    <div className="dash-layout">
        
        {/* MODAL EDIT */}
        {isEditing && (
            <div className="modal-overlay">
                <div className="modal-content">
                    <h3 style={{marginTop:0}}>Modifier Profil</h3>
                    <div className="input-group"><label>Avatar URL</label><input value={editForm.avatar} onChange={(e) => setEditForm({...editForm, avatar: e.target.value})} /></div>
                    <div className="input-group"><label>Métier</label><input value={editForm.metier} onChange={(e) => setEditForm({...editForm, metier: e.target.value})} /></div>
                    <div className="input-group"><label>Téléphone</label><input value={editForm.tel} onChange={(e) => setEditForm({...editForm, tel: e.target.value})} /></div>
                    <div className="input-group"><label>Banque</label><input value={editForm.banque} onChange={(e) => setEditForm({...editForm, banque: e.target.value})} /></div>
                    <div className="modal-actions">
                        <button className="btn-confirm" onClick={saveProfile}>Sauvegarder</button>
                        <button className="btn-cancel" onClick={() => setIsEditing(false)}>Annuler</button>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL ALERT */}
        {modal.show && (
            <div className="modal-overlay">
                <div className="modal-content">
                    <h3 style={{marginTop:0}}>{modal.title}</h3>
                    <p>{modal.msg}</p>
                    <div className="modal-actions">
                        {modal.onConfirm && <button className="btn-confirm" onClick={modal.onConfirm}>Confirmer</button>}
                        <button className="btn-cancel" onClick={() => setModal({...modal, show: false})}>Fermer</button>
                    </div>
                </div>
            </div>
        )}

        {/* HEADER PRO */}
        <div className="user-header">
             <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
                 <img src={bniLogo} alt="Logo" style={{height:'50px'}} />
                 <div>
                     <h2 style={{margin:0, fontSize:'1.5rem', color:'white'}}>BNI CONNECT</h2>
                     <span style={{color:'var(--highlight)', fontSize:'0.9rem', letterSpacing:'1px'}}>CITOYEN VÉRIFIÉ</span>
                 </div>
             </div>
             
             <div style={{display:'flex', alignItems:'center', gap:'20px', cursor:'pointer'}} onClick={() => setIsEditing(true)}>
                 <div style={{textAlign:'right'}}>
                     <div style={{fontWeight:'bold', fontSize:'1.2rem'}}>{user.info.prenom} {user.info.nom}</div>
                     <div style={{color:'#b0c4de', fontSize:'0.9rem'}}>{user.info.metier}</div>
                 </div>
                 <div style={{width:'60px', height:'60px', borderRadius:'50%', border:'3px solid var(--highlight)', backgroundImage:`url(${user.info.avatar})`, backgroundSize:'cover', backgroundPosition:'center', backgroundColor:'#333'}}></div>
                 <button onClick={(e) => { e.stopPropagation(); auth.signOut(); }} style={{background:'rgba(255,0,0,0.2)', border:'1px solid red', color:'red', padding:'10px', borderRadius:'8px', cursor:'pointer'}}>
                    <i className="fas fa-power-off"></i> OFF
                 </button>
             </div>
        </div>

        {/* STATS GRID */}
        <div className="stats-grid">
            {/* SOLDE */}
            <div className="stat-box">
                <div style={{display:'flex', justifyContent:'space-between', color:'#b0c4de', fontSize:'1rem', marginBottom:'10px'}}>
                    <span>ARGENT EN ATTENTE</span>
                    {user.economy.statutRetrait === 'waiting' && <span style={{color:'orange'}}>● Vérification</span>}
                </div>
                <div style={{fontSize:'4rem', fontWeight:'bold', color:'white'}}>
                    ${user.economy.enAttente}
                </div>
                <div style={{marginTop:'20px'}}>
                    <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.9rem', color:'#aaa', marginBottom:'5px'}}>
                        <span>Objectif Virement: $2000</span>
                        <span>{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="progress-bg">
                        <div className="progress-fill" style={{width: `${progressPercent}%`, background: progressPercent >= 100 ? '#00c853' : '#00b4d8'}}></div>
                    </div>
                </div>
            </div>

            {/* ACTIVITÉ */}
            <div className="stat-box" style={{textAlign:'center'}}>
                <div style={{marginBottom:'20px'}}>
                    <span style={{background:'rgba(0, 180, 216, 0.2)', color:'#00b4d8', padding:'8px 16px', borderRadius:'20px', fontSize:'0.9rem', fontWeight:'bold'}}>
                        QUOTA : {user.game.lastQuestionDate === new Date().toLocaleDateString('fr-FR') ? user.game.dailyCount : 0} / 5
                    </span>
                </div>
                <h3 style={{margin:'0 0 10px 0', fontSize:'1.4rem'}}>Activité Citoyenne</h3>
                <p style={{color:'#b0c4de', marginBottom:'25px'}}>Répondez aux questions pour générer du crédit.</p>
                <button onClick={handleActivity} className="btn-action">
                    RÉPONDRE (+$50)
                </button>
            </div>
        </div>

        {/* RETRAIT */}
        <div className="pro-card" style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'20px'}}>
             <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
                 <div style={{fontSize:'2.5rem', color:'white'}}>€</div>
                 <div>
                     <h3 style={{margin:0}}>Virement Bancaire</h3>
                     <p style={{margin:0, color:'#b0c4de'}}>Vers le compte : <span style={{color:'white', fontWeight:'bold'}}>{user.info.banque}</span></p>
                 </div>
             </div>
             
             {user.economy.enAttente >= 2000 && user.economy.statutRetrait !== 'waiting' ? (
                 <button onClick={handleWithdraw} className="btn-main" style={{width:'auto', padding:'10px 40px'}}>
                     INITIER VIREMENT
                 </button>
             ) : (
                 <div style={{padding:'10px 20px', border:'2px dashed #555', borderRadius:'8px', color:'#aaa', fontWeight:'bold'}}>
                     {user.economy.statutRetrait === 'waiting' ? 'EN COURS DE VALIDATION' : 'MINIMUM REQUIS : $2000'}
                 </div>
             )}
        </div>
        
        <div style={{textAlign:'center', marginTop:'40px', color:'#aaa'}}>
            Total Sécurisé : <span style={{color:'#00c853', fontWeight:'bold'}}>${user.economy.gagneTotal}</span>
        </div>
    </div>
  );
}