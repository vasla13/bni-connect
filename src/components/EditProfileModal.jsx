import { useState } from 'react';

export default function EditProfileModal({ user, onClose, onSave }) {
  // On charge les infos actuelles
  const [formData, setFormData] = useState({ ...user.info });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="overlay">
      <div className="modal-box" style={{ maxWidth: '600px', width: '90%', textAlign: 'left' }}>
        <h2 className="text-cyan text-center mb-4">MISE À JOUR DOSSIER</h2>
        
        <form onSubmit={handleSubmit} style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '10px' }}>
            
            {/* SECTION 1 : DATA CRITIQUE */}
            <h4 className="text-warning mb-2" style={{ borderBottom: '1px solid var(--warning)' }}>IDENTITÉ</h4>
            <div className="grid-2" style={{ gap: '15px' }}>
                <div className="input-group">
                    <label>Prénom</label>
                    <input name="prenom" value={formData.prenom} onChange={handleChange} required />
                </div>
                <div className="input-group">
                    <label>Nom</label>
                    <input name="nom" value={formData.nom} onChange={handleChange} required />
                </div>
                <div className="input-group">
                    <label>Téléphone</label>
                    <input name="telephone" value={formData.telephone} onChange={handleChange} required />
                </div>
                <div className="input-group">
                    <label>IBAN / Banque</label>
                    <input name="banque" value={formData.banque} onChange={handleChange} required />
                </div>
            </div>

            {/* SECTION 2 : PHYSIQUE & PRO */}
            <h4 className="text-cyan mb-2 mt-4" style={{ borderBottom: '1px solid var(--primary)' }}>PROFIL & BIOMÉTRIE</h4>
            <div className="grid-2" style={{ gap: '15px' }}>
                <div className="input-group">
                    <label>Photo (URL)</label>
                    <input name="photoUrl" value={formData.photoUrl} onChange={handleChange} placeholder="https://..." />
                </div>
                <div className="input-group">
                    <label>Métier</label>
                    <input name="metier" value={formData.metier} onChange={handleChange} />
                </div>
                <div className="input-group">
                    <label>Cheveux</label>
                    <input name="cheveux" value={formData.cheveux} onChange={handleChange} />
                </div>
                <div className="input-group">
                    <label>Peau</label>
                    <input name="peau" value={formData.peau} onChange={handleChange} />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn-secondary w-full" onClick={onClose}>ANNULER</button>
                <button type="submit" className="btn-main w-full">ENREGISTRER</button>
            </div>
        </form>
      </div>
    </div>
  );
}