import { ShieldCheck, Activity, Clock } from 'lucide-react';

export default function WalletPanel({ user, pendingAmount, onWithdraw }) {
  return (
    <div>
        <h3 className="tech-font mb-4" style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>/// FINANCE</h3>
        
        <div className="pro-card" style={{ borderLeft: '4px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
           <div style={{ position: 'absolute', right: '10px', top: '10px', opacity: 0.05 }}>
              <ShieldCheck size={120} />
           </div>

           {/* 1. EN ATTENTE DE VALIDATION */}
           <div className="stat-section">
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ color: 'var(--primary)', marginBottom: 0 }}>EN ATTENTE DE VALIDATION</label>
                    <Activity size={16} color="var(--primary)"/>
               </div>
               <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', margin: '10px 0' }}>
                   <h2 style={{ fontSize: '3rem', margin: 0, lineHeight: 1 }}>
                      {user.economy.enAttente}
                   </h2>
                   <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>$</span>
               </div>
               
               {user.economy.enAttente >= 2000 ? (
                   <button className="btn-main" onClick={onWithdraw}>
                      DEMANDER LA VALIDATION
                   </button>
               ) : (
                   <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                      (Minimum 2000$ pour valider)
                   </div>
               )}
           </div>

           {/* 2. ATTENTE DE PAIEMENT */}
           <div className="stat-row warning">
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <Clock size={20} color="var(--warning)"/>
                   <div>
                       <div style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 'bold' }}>ATTENTE DE PAIEMENT</div>
                       <div style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>Virements émis</div>
                   </div>
               </div>
               <span className="tech-font" style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--warning)' }}>
                   {pendingAmount} $
               </span>
           </div>

           {/* 3. MONTANT DÉJÀ VALIDÉ */}
           <div className="stat-row success">
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <ShieldCheck size={20} color="#10b981"/>
                   <div>
                       <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold' }}>FONDS SÉCURISÉS</div>
                       <div style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>Reçu en banque</div>
                   </div>
               </div>
               <span className="tech-font" style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>
                   {user.economy.gagneTotal || 0} $
               </span>
           </div>
        </div>
    </div>
  );
}