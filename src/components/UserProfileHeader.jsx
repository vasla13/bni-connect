import logo from '../assets/logo.png';
import { LogOut, UserPen, Trophy } from 'lucide-react'; // Import des icônes

export default function UserProfileHeader({ user, onEdit, onLogout }) {
  
  // Logique des Grades
  const totalGagne = user.economy.gagneTotal || 0;
  let grade = { label: "Stagiaire", color: "#6c757d" }; // Gris
  if (totalGagne >= 500) grade = { label: "Cadre Supérieur", color: "#8a2be2" }; // Violet
  if (totalGagne >= 5000) grade = { label: "PDG", color: "#00d2ff" }; // Cyan

  return (
    <div className="pro-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
      
      {/* GAUCHE : Logo + Infos + Grade */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <img 
            src={logo} 
            alt="Logo BNI" 
            style={{ height: '60px', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '20px' }} 
        />
        
        <div style={{ position: 'relative' }}>
          <img 
            src={user.info.avatar} 
            style={{ width: '70px', height: '70px', borderRadius: '50%', border: `2px solid ${grade.color}`, objectFit: 'cover' }} 
            alt="Avatar" 
          />
          {/* Petit badge trophée */}
          <div style={{ position: 'absolute', bottom: -5, right: -5, background: grade.color, borderRadius: '50%', padding: '4px' }}>
            <Trophy size={14} color="white" />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0 }}>{user.info.prenom} {user.info.nom}</h2>
            {/* Badge de Grade */}
            <span style={{ 
              fontSize: '0.7rem', 
              background: grade.color, 
              padding: '2px 8px', 
              borderRadius: '12px', 
              fontWeight: 'bold',
              textTransform: 'uppercase'
            }}>
              {grade.label}
            </span>
          </div>
          
          <button 
            className="btn-secondary" 
            style={{ padding: '5px 10px', fontSize: '0.8rem', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' }} 
            onClick={onEdit}
          >
            <UserPen size={14} /> Modifier Profil
          </button>
        </div>
      </div>
      
      {/* DROITE : Argent + Déconnexion */}
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '1.8rem', color: 'var(--success)', fontFamily: 'Rajdhani', fontWeight: 'bold' }}>
          {user.economy.gagneTotal} $
        </div>
        <button 
            className="btn-danger" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '5px' }} 
            onClick={onLogout}
        >
          <LogOut size={14} /> DÉCONNEXION
        </button>
      </div>
    </div>
  );
}