import logo from '../assets/logo.png'; 

export default function UserProfileHeader({ user, onEdit, onLogout }) {
  const getInitials = () => {
    const p = user.info.prenom ? user.info.prenom[0] : "";
    const n = user.info.nom ? user.info.nom[0] : "";
    return (p + n).toUpperCase() || "U";
  };

  return (
    <header style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        marginBottom: '2rem', padding: '1rem 2rem', 
        background: 'rgba(2, 6, 23, 0.95)', 
        borderBottom: '1px solid var(--primary)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        position: 'sticky', top: 0, zIndex: 100 
    }}>
      
      {/* GAUCHE : LOGO & IDENTITÉ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
        
        {/* LOGO */}
        <div style={{ paddingRight: '25px', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
            <img 
                src={logo} 
                alt="BNI Connect" 
                style={{ height: '40px' }} // Taille standard
            />
        </div>

        {/* INFO UTILISATEUR */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ 
                width: '45px', height: '45px', borderRadius: '50%', overflow: 'hidden', 
                background: 'var(--secondary)', border: '2px solid var(--primary)',
                display: 'flex', justifyContent: 'center', alignItems: 'center'
            }}>
              {user.info.photoUrl ? (
                <img src={user.info.photoUrl} alt="Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontWeight: 'bold' }}>{getInitials()}</span>
              )}
            </div>

            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: 'white' }}>
                {user.info.prenom} {user.info.nom}
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '2px' }}>
                 SESSION ACTIVE
              </div>
            </div>
        </div>
      </div>

      {/* DROITE : ACTIONS */}
      <div style={{ display: 'flex', gap: '15px' }}>
        <button 
            className="btn-secondary" 
            onClick={onEdit}
            style={{ fontSize: '0.85rem' }}
        >
            MON PROFIL
        </button>
        <button 
            className="btn-danger" 
            onClick={onLogout}
            style={{ fontSize: '0.85rem', padding: '8px 16px' }}
        >
            SE DÉCONNECTER
        </button>
      </div>
    </header>
  );
}