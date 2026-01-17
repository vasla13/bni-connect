import logo from '../assets/logo.png'; 
import { History } from 'lucide-react';

export default function UserProfileHeader({ user, onEdit, onShowHistory, onLogout }) {
  const getInitials = () => {
    const p = user.info.prenom ? user.info.prenom[0] : "";
    const n = user.info.nom ? user.info.nom[0] : "";
    return (p + n).toUpperCase() || "U";
  };

  return (
    <header style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        marginBottom: '2rem', padding: '1rem 2rem', 
        background: 'rgba(15, 23, 42, 0.9)', 
        borderBottom: '1px solid #334155',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(10px)'
    }}>
      
      {/* GAUCHE : LOGO & IDENTITÉ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
        <div style={{ paddingRight: '25px', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
            <img src={logo} alt="BNI Connect" style={{ height: '40px' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div className="avatar">
              {user.info.photoUrl ? (
                <img src={user.info.photoUrl} alt="Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span>{getInitials()}</span>
              )}
            </div>

            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: '#f1f5f9' }}>
                {user.info.prenom} {user.info.nom}
              </h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--primary)', letterSpacing: '1px' }}>
                 ID: {user.info.email ? user.info.email.split('@')[0].toUpperCase() : 'UNKNOWN'}
              </div>
            </div>
        </div>
      </div>

      {/* DROITE : ACTIONS */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="btn-secondary" onClick={onShowHistory} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={16} /> HISTORIQUE
        </button>
        <button className="btn-secondary" onClick={onEdit}>
            MON PROFIL
        </button>
        <button className="btn-danger" onClick={onLogout}>
            DECONNEXION
        </button>
      </div>
    </header>
  );
}