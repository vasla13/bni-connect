import logo from '../assets/logo.png';

export default function UserProfileHeader({ user, onEdit, onLogout }) {
  return (
    <div className="pro-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Logo intégré */}
        <img 
            src={logo} 
            alt="Logo BNI" 
            style={{ height: '60px', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '20px' }} 
        />
        
        <img 
          src={user.info.avatar} 
          style={{ width: '70px', height: '70px', borderRadius: '50%', border: '2px solid var(--primary)', objectFit: 'cover' }} 
          alt="Avatar" 
        />
        <div>
          <h2 style={{ margin: 0 }}>{user.info.prenom} {user.info.nom}</h2>
          <button className="btn-secondary" style={{ padding: '2px 8px', fontSize: '0.7rem' }} onClick={onEdit}>
            ✎ MODIFIER PROFIL
          </button>
        </div>
      </div>
      
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '1.8rem', color: 'var(--success)', fontFamily: 'Rajdhani', fontWeight: 'bold' }}>
          {user.economy.gagneTotal} $
        </div>
        <button className="btn-danger" style={{ fontSize: '0.7rem' }} onClick={onLogout}>
          DÉCONNEXION
        </button>
      </div>
    </div>
  );
}