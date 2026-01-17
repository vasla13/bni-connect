import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
// AJOUTEZ L'IMPORT ICI
import { LogOut, CreditCard, Users, FileText, Zap } from 'lucide-react'; 
import PaymentsPanel from '../components/admin/PaymentsPanel';
import UsersPanel from '../components/admin/UsersPanel';
import FormsPanel from '../components/admin/FormsPanel';
import TasksPanel from '../components/admin/TasksPanel'; // <--- IMPORT

export default function Admin() {
  const [tab, setTab] = useState('paiements');
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const NavButton = ({ id, label, icon: Icon }) => (
    <button 
      onClick={() => setTab(id)}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
        padding: '15px', background: tab === id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
        color: tab === id ? '#000' : '#fff', border: tab === id ? 'none' : '1px solid #334155',
        borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s'
      }}
    >
      <Icon size={20} /> {label}
    </button>
  );

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid #334155' }}>
          <h1 className="tech-font text-cyan" style={{ margin: 0, fontSize: '1.8rem' }}>CONSOLE ADMIN</h1>
          <button onClick={handleLogout} className="btn-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.9rem' }}>
            <LogOut size={16} /> DÉCONNEXION
          </button>
      </div>
      
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
        <NavButton id="paiements" label="FINANCES" icon={CreditCard} />
        <NavButton id="users" label="CITOYENS" icon={Users} />
        <NavButton id="tasks" label="TÂCHES RAPIDES" icon={Zap} /> {/* NOUVEAU BOUTON */}
        <NavButton id="forms" label="DOSSIERS" icon={FileText} />
      </div>

      <div style={{ minHeight: '600px' }}>
        {tab === 'paiements' && <PaymentsPanel />}
        {tab === 'users' && <UsersPanel />}
        {tab === 'tasks' && <TasksPanel />} {/* NOUVEAU PANNEAU */}
        {tab === 'forms' && <FormsPanel />}
      </div>
    </div>
  );
}