import logo from '../assets/logo.png'; 
import { History, Briefcase, UserCheck, Settings, LogOut } from 'lucide-react';

export default function UserProfileHeader({ user, onEdit, onShowHistory, onLogout }) {
  
  const getInitials = () => {
    const p = user.info.prenom ? user.info.prenom[0] : "";
    const n = user.info.nom ? user.info.nom[0] : "";
    return (p + n).toUpperCase() || "U";
  };

  return (
    <header className="topbar">
      
      {/* GAUCHE : LOGO & IDENTITÉ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '25px', paddingLeft: '2rem' }}>
        <div style={{ paddingRight: '25px', borderRight: 'var(--border-light)' }}>
            <img src={logo} alt="BNI Connect" style={{ height: '40px' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {/* AVATAR */}
            <div className="avatar">
              {user.info.photoUrl ? (
                <img src={user.info.photoUrl} alt="Profil" style={{ width: '100%', height: '100%', objectFit: 'cover', clipPath: 'polygon(15% 0, 100% 0, 100% 85%, 85% 100%, 0 100%, 0 15%)' }} />
              ) : (
                <span>{getInitials()}</span>
              )}
            </div>

            {/* INFO UTILISATEUR */}
            <div>
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>
                {user.info.prenom} {user.info.nom}
              </h2>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                 <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: '600' }}>
                    <Briefcase size={12} /> {user.info.metier || "Citoyen"}
                 </span>
                 <span style={{ width: '4px', height: '4px', background: '#334155', borderRadius: '50%' }}></span>
                 <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <UserCheck size={12} /> IDENTIFIÉ
                 </span>
              </div>
            </div>
        </div>
      </div>

      {/* DROITE : ACTIONS */}
      <div style={{ display: 'flex', gap: '10px', paddingRight: '2rem' }}>
        <button className="btn-secondary" onClick={onShowHistory} title="Voir l'historique">
            <History size={18} /> <span style={{ marginLeft: '8px' }}>HISTORIQUE</span>
        </button>
        <button className="btn-secondary" onClick={onEdit} title="Modifier le profil">
            <Settings size={18} /> <span style={{ marginLeft: '8px' }}>PROFIL</span>
        </button>
        <button className="btn-danger" onClick={onLogout} title="Se déconnecter" style={{ width: 'auto', padding: '10px' }}>
            <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}