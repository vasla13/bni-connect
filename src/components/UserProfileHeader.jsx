import logo from '../assets/logo.png'; 
import { History, Briefcase, UserCheck, Settings, LogOut } from 'lucide-react';

export default function UserProfileHeader({ user, onEdit, onShowHistory, onLogout }) {
  // Génère les initiales (ex: DC pour Dutch Coleman)
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
            {/* AVATAR (Initiales ou Photo) */}
            <div className="avatar">
              {user.info.photoUrl ? (
                <img src={user.info.photoUrl} alt="Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span>{getInitials()}</span>
              )}
            </div>

            {/* INFO UTILISATEUR */}
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: '#f1f5f9', lineHeight: '1.2' }}>
                {user.info.prenom} {user.info.nom}
              </h2>
              
              {/* SOUS-TITRE : MÉTIER & STATUT (Au lieu de l'ID répétitif) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                 
                 {/* Métier (ex: Boulanger) ou "Citoyen" par défaut */}
                 <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: '600' }}>
                    <Briefcase size={12} /> {user.info.metier || "Citoyen"}
                 </span>

                 <span style={{ width: '4px', height: '4px', background: '#334155', borderRadius: '50%' }}></span>
                 
                 {/* Statut En Ligne */}
                 <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <UserCheck size={12} /> IDENTIFIÉ
                 </span>
              </div>
            </div>
        </div>
      </div>

      {/* DROITE : ACTIONS (Boutons avec Icônes) */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="btn-secondary" onClick={onShowHistory} title="Voir l'historique">
            <History size={18} /> <span style={{ marginLeft: '8px' }}>HISTORIQUE</span>
        </button>
        <button className="btn-secondary" onClick={onEdit} title="Modifier le profil">
            <Settings size={18} /> <span style={{ marginLeft: '8px' }}>PROFIL</span>
        </button>
        <button className="btn-danger" onClick={onLogout} title="Se déconnecter">
            <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}