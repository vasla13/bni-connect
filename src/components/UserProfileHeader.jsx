export default function UserProfileHeader({ user, onEdit, onLogout }) {
  const getInitials = () => {
    const p = user.info.prenom ? user.info.prenom[0] : "";
    const n = user.info.nom ? user.info.nom[0] : "";
    return (p + n).toUpperCase() || "U";
  };

  return (
    <header style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        marginBottom: '2rem', padding: '1.5rem', 
        background: 'var(--glass-bg)', border: 'var(--glass-border)',
        borderRadius: 'var(--radius)', backdropFilter: 'blur(10px)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        
        {/* AVATAR */}
        <div style={{ 
            width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', 
            background: 'var(--secondary)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            border: '2px solid var(--primary)', boxShadow: '0 0 15px var(--primary-glow)'
        }}>
          {user.info.photoUrl && user.info.photoUrl.trim() !== "" ? (
            <img src={user.info.photoUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'Rajdhani' }}>{getInitials()}</span>
          )}
        </div>

        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', lineHeight: '1' }}>{user.info.prenom} {user.info.nom}</h2>
          <span className="text-cyan" style={{ fontSize: '0.8rem', letterSpacing: '1px' }}>MATRICULE ACTIF</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        {/* LE BOUTON EST DE RETOUR ICI */}
        <button className="btn-secondary" onClick={onEdit}>ÉDITER DOSSIER</button>
        <button className="btn-danger" onClick={onLogout}>DÉCONNEXION</button>
      </div>
    </header>
  );
}