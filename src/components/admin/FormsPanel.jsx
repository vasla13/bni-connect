import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { ShieldCheck, FileText, Lock, AlertTriangle, Database, Trash2, Edit, Plus, Save, X, LayoutList, AlignLeft, ListChecks, ActivitySquare, Image as ImageIcon } from 'lucide-react';

const ICON_OPTIONS = [
    { value: 'file', label: 'Dossier', icon: FileText },
    { value: 'lock', label: 'Sécurité', icon: Lock },
    { value: 'shield', label: 'Admin', icon: ShieldCheck },
    { value: 'alert', label: 'Urgent', icon: AlertTriangle },
    { value: 'db', label: 'Donnée', icon: Database },
];

const COLOR_OPTIONS = [
    { value: '#38bdf8', label: 'Cyan' }, { value: '#f59e0b', label: 'Orange' },
    { value: '#ef4444', label: 'Rouge' }, { value: '#a855f7', label: 'Violet' }, { value: '#10b981', label: 'Vert' },
];

export default function FormsPanel() {
  const [forms, setForms] = useState([]);
  const [editingId, setEditingId] = useState(null); 
  const [formData, setFormData] = useState({ title: '', desc: '', reward: '', color: '#38bdf8', icon: 'file', questions: [] });
  
  // Quick Add State
  const [qText, setQText] = useState("");
  const [qType, setQType] = useState("text"); 
  const [qOptions, setQOptions] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "forms"), (snap) => setForms(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  const handleCreate = () => {
     setFormData({ title: 'Nouveau Dossier', desc: '', reward: '1000 $', color: '#38bdf8', icon: 'file', questions: [] });
     setEditingId('new');
  };

  const handleEdit = (form) => {
     setFormData({ ...form, questions: form.questions || [] });
     setEditingId(form.id);
  };

  const handleSave = async () => {
      if(!formData.title) return alert("Titre requis");
      try {
          if(editingId === 'new') await addDoc(collection(db, "forms"), { ...formData, createdAt: new Date().toISOString() });
          else await updateDoc(doc(db, "forms", editingId), formData);
          setEditingId(null);
      } catch(e) { alert(e.message); }
  };

  const handleDelete = async (id) => {
      if(window.confirm("Supprimer ?")) await deleteDoc(doc(db, "forms", id));
  };

  const addQuestion = () => {
      if(!qText) return;
      const newQ = {
          id: Date.now(), type: qType, text: qText,
          options: qType === 'qcm' ? qOptions.split(',').map(s=>s.trim()).filter(s=>s) : [],
          imageUrl: '' 
      };
      setFormData({ ...formData, questions: [...formData.questions, newQ] });
      setQText(""); setQOptions(""); setQType("text");
  };

  const deleteQuestion = (id) => {
      setFormData({ ...formData, questions: formData.questions.filter(q => q.id !== id) });
  };

  if(editingId === null) {
      return (
        <div className="grid-2">
            <div className="pro-card flex-center" style={{ border: '2px dashed var(--primary)', cursor: 'pointer', minHeight: '200px', flexDirection: 'column', gap: '15px' }} onClick={handleCreate}>
                <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '20px', borderRadius: '50%' }}><Plus size={40} color="var(--primary)" /></div>
                <h3 className="text-cyan">CRÉER UN DOSSIER</h3>
            </div>
            {forms.map(form => (
                <div key={form.id} className="pro-card" style={{ borderColor: form.color, position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <h3 style={{ margin: 0, color: form.color }}>{form.title}</h3>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <button onClick={() => handleEdit(form)} className="btn-secondary" style={{ padding: '5px' }}><Edit size={16}/></button>
                            <button onClick={() => handleDelete(form.id)} className="btn-danger" style={{ padding: '5px' }}><Trash2 size={16}/></button>
                        </div>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{form.desc || "Pas de description"}</p>
                    <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between' }}>
                         <span style={{ fontWeight: 'bold' }}>{form.reward}</span>
                         <span className="text-muted" style={{ fontSize: '0.8rem' }}>{form.questions ? form.questions.length : 0} Questions</span>
                    </div>
                </div>
            ))}
        </div>
      );
  }

  return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px', height: 'calc(100vh - 150px)' }}>
          <div className="pro-card" style={{ display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid #334155', background: 'rgba(0,0,0,0.2)' }}><h3 className="tech-font text-cyan" style={{ margin: 0 }}>CONTENU</h3></div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                  {formData.questions.length === 0 && <div className="text-center text-muted" style={{ marginTop: '50px' }}><LayoutList size={40} style={{ opacity: 0.3 }} /><p>Aucune question.</p></div>}
                  {formData.questions.map((q, i) => (
                      <div key={q.id} style={{ display: 'flex', gap: '15px', marginBottom: '15px', background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '8px', borderLeft: `4px solid ${q.type === 'alert' ? 'var(--danger)' : 'var(--primary)'}` }}>
                          <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Q{i+1}</div>
                          <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '500', marginBottom: '5px' }}>{q.text}</div>
                              <div style={{ display: 'flex', gap: '10px', fontSize: '0.75rem' }}><span style={{ background: '#334155', padding: '2px 6px', borderRadius: '4px' }}>{q.type.toUpperCase()}</span>{q.type === 'qcm' && <span className="text-muted">{q.options.length} options</span>}</div>
                          </div>
                          <button onClick={() => deleteQuestion(q.id)} className="text-danger" style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
                      </div>
                  ))}
              </div>
              <div style={{ padding: '15px', borderTop: '1px solid #334155', background: '#0f172a' }}>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      {[ {t:'text', i:AlignLeft}, {t:'qcm', i:ListChecks}, {t:'range', i:ActivitySquare}, {t:'image', i:ImageIcon} ].map(x => (
                          <button key={x.t} onClick={() => setQType(x.t)} style={{ flex: 1, padding: '8px', background: qType === x.t ? 'var(--primary)' : '#1e293b', border: 'none', borderRadius: '4px', color: qType===x.t?'black':'white' }}><x.i size={20} /></button>
                      ))}
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                          <input value={qText} onChange={e => setQText(e.target.value)} placeholder="Question..." onKeyDown={e => e.key === 'Enter' && addQuestion()} style={{ borderRadius: '4px 4px 0 0', borderBottom: 'none' }} />
                          {qType === 'qcm' && <input value={qOptions} onChange={e => setQOptions(e.target.value)} placeholder="Options (Oui, Non...)" style={{ borderRadius: '0 0 4px 4px', borderTop: '1px solid #334155', background: '#1e293b', fontSize: '0.9rem' }} />}
                      </div>
                      <button className="btn-main" onClick={addQuestion} style={{ width: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={24} /></button>
                  </div>
              </div>
          </div>
          <div className="pro-card" style={{ height: 'fit-content' }}>
              <h3 className="tech-font mb-4">PARAMÈTRES</h3>
              <div className="input-group"><label>TITRE</label><input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
              <div className="input-group"><label>DESCRIPTION</label><textarea rows={3} value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} /></div>
              <div className="input-group"><label>GAIN</label><input value={formData.reward} onChange={e => setFormData({...formData, reward: e.target.value})} /></div>
              <div className="grid-2">
                  <div className="input-group"><label>COULEUR</label><div style={{ display: 'flex', gap: '5px' }}>{COLOR_OPTIONS.map(c => (<div key={c.value} onClick={() => setFormData({...formData, color: c.value})} style={{ width: '20px', height: '20px', borderRadius: '50%', background: c.value, cursor: 'pointer', border: formData.color === c.value ? '2px solid white' : 'none' }} />))}</div></div>
                  <div className="input-group"><label>ICÔNE</label><select value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})}>{ICON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
              </div>
              <hr style={{ borderColor: '#334155', margin: '20px 0' }} />
              <button className="btn-main w-full mb-2" onClick={handleSave}><Save size={18} style={{ marginRight: '8px' }} /> ENREGISTRER</button>
              <button className="btn-secondary w-full" onClick={() => setEditingId(null)}>ANNULER</button>
          </div>
      </div>
  );
}