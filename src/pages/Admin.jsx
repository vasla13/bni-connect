import { useState } from 'react';
import PaymentsPanel from '../components/admin/PaymentsPanel';
import UsersPanel from '../components/admin/UsersPanel';
import FormsPanel from '../components/admin/FormsPanel';

export default function Admin() {
  const [tab, setTab] = useState('paiements');

  return (
    <div className="container">
      <h1 className="tech-font text-cyan mb-6">CONSOLE ADMINISTRATION</h1>
      
      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>
        <button className={tab === 'paiements' ? 'btn-main' : 'btn-secondary'} onClick={() => setTab('paiements')}>PAIEMENTS</button>
        <button className={tab === 'users' ? 'btn-main' : 'btn-secondary'} onClick={() => setTab('users')}>CITOYENS</button>
        <button className={tab === 'forms' ? 'btn-main' : 'btn-secondary'} onClick={() => setTab('forms')}>FORMULAIRES</button>
      </div>

      {tab === 'paiements' && <PaymentsPanel />}
      {tab === 'users' && <UsersPanel />}
      {tab === 'forms' && <FormsPanel />}
    </div>
  );
}