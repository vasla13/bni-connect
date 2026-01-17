import { ShieldCheck, Activity, Clock } from 'lucide-react';

export default function WalletPanel({ user, pendingAmount, onWithdraw }) {
  return (
    <div>
        <h3 className="tech-font" style={{ marginBottom: '1rem', fontSize: '1.2rem', color: 'var(--primary)' }}>/// FINANCE</h3>
        
        <div className="pro-card" style={{ borderLeft: '4px solid var(--primary)', position: 'relative', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
           <div style={{ position: 'absolute', right: '10px', top: '10px', opacity: 0.05 }}>
              <ShieldCheck size={120} />
           </div>

           {/* 1. EN ATTENTE DE VALIDATION */}
           <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ color: 'var(--primary)', marginBottom: 0 }}>EN ATTENTE DE VALIDATION</label>
                    <Activity size={16} color="var(--primary)"/>
               </div>
               <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', margin: '10px 0' }}>
                   <h2 style={{ fontSize: '3rem', margin: 0, fontFamily: 'Rajdhani', lineHeight: 1, color: '#fff' }}>
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
           <div style={{ 
               background: 'rgba(245, 158, 11, 0.1)', 
               border: '1px solid rgba(245, 158, 11, 0.3)', 
               padding: '12px', borderRadius: '4px',
               display: 'flex', justifyContent: 'space-between', alignItems: 'center'
           }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <Clock size={20} color="var(--warning)"/>
                   <div>
                       <div style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 'bold' }}>ATTENTE DE PAIEMENT</div>
                       <div style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>Virements émis</div>
                   </div>
               </div>
               <span style={{ fontFamily: 'Rajdhani', fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--warning)' }}>
                   {pendingAmount} $
               </span>
           </div>

           {/* 3. MONTANT DÉJÀ VALIDÉ */}
           <div style={{ 
               background: 'rgba(16, 185, 129, 0.1)', 
               border: '1px solid rgba(16, 185, 129, 0.3)', 
               padding: '12px', borderRadius: '4px',
               display: 'flex', justifyContent: 'space-between', alignItems: 'center'
           }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <ShieldCheck size={20} color="#10b981"/>
                   <div>
                       <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold' }}>FONDS SÉCURISÉS</div>
                       <div style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>Reçu en banque</div>
                   </div>
               </div>
               <span style={{ fontFamily: 'Rajdhani', fontSize: '1.3rem', fontWeight: 'bold', color: '#fff' }}>
                   {user.economy.gagneTotal || 0} $
               </span>
           </div>
        </div>
    </div>
  );
}