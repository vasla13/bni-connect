import { useState } from 'react';

export default function EditProfileModal({ user, onClose, onSave }) {
  // Le state est géré localement ici, plus dans le Dashboard !
  const [form, setForm] = useState(user.info || {});

  const handleSave = () => {
    onSave(form);
  };

  return (
    <div className="overlay">
      <div className="modal-box" style={{ textAlign: 'left' }}>
         <h3 className="text-cyan" style={{ textAlign: 'center', marginBottom: '20px' }}>MODIFIER MON PROFIL</h3>
         
         <div className="input-group">
           <label>Avatar (Lien URL)</label>
           <input 
             value={form.avatar || ''} 
             onChange={e => setForm({...form, avatar: e.target.value})} 
             placeholder="https://..."
           />
         </div>
         
         <div className="input-group">
           <label>Numéro de Téléphone</label>
           <input 
             value={form.tel || ''} 
             onChange={e => setForm({...form, tel: e.target.value})} 
             placeholder="Ex: 06 12 34 56 78"
           />
         </div>

         <div className="input-group">
           <label>Métier / Poste</label>
           <input 
             value={form.metier || ''} 
             onChange={e => setForm({...form, metier: e.target.value})} 
             placeholder="Ex: Développeur Web"
           />
         </div>

         <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
            <button className="btn-main" onClick={handleSave}>SAUVEGARDER</button>
            <button className="btn-danger" onClick={onClose}>ANNULER</button>
         </div>
      </div>
    </div>
  );
}