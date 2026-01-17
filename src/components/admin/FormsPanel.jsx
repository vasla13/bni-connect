import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { ShieldCheck, FileText, Lock, AlertTriangle, Database, Trash2, Edit, Plus, Save, LayoutList, AlignLeft, ListChecks, ActivitySquare, Image as ImageIcon, X, Check } from 'lucide-react';

// Options pour l'icône du dossier global
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

const QUESTION_TYPES = [
    { id: 'text', label: 'TEXTE LIBRE', icon: AlignLeft },
    { id: 'qcm', label: 'QCM (CHOIX)', icon: ListChecks },
    { id: 'range', label: 'JAUGE (0-10)', icon: ActivitySquare },
];

export default function FormsPanel() {
  const [forms, setForms] = useState([]);
  const [editingId, setEditingId] = useState(null); 
  const [formData, setFormData] = useState({ title: '', desc: '', reward: '', color: '#38bdf8', icon: 'file', questions: [] });
  
  // --- ÉTAT DU "CONSTRUCTEUR DE QUESTION" ---
  const [qType, setQType] = useState("text"); 
  const [qText, setQText] = useState("");
  const [qImage, setQImage] = useState(""); // URL Image pour la question
  
  // Gestion spécifique pour le QCM
  const [currentOption, setCurrentOption] = useState(""); 
  const [qOptionsList, setQOptionsList] = useState([]); 

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "forms"), (snap) => setForms(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  // --- GESTION DES DOSSIERS ---
  const handleCreate = () => {
     setFormData({ title: 'Nouveau Dossier', desc: '', reward: '1000 $', color: '#38bdf8', icon: 'file', questions: [] });
     setEditingId('new');
  };

  const handleEdit = (form) => {
     setFormData({ ...form, questions: form.questions || [] });
     setEditingId(form.id);
  };

  const handleSave = async () => {
      if(!formData.title) return alert("Le titre du dossier est requis.");
      try {
          if(editingId === 'new') await addDoc(collection(db, "forms"), { ...formData, createdAt: new Date().toISOString() });
          else await updateDoc(doc(db, "forms", editingId), formData);
          setEditingId(null);
      } catch(e) { alert(e.message); }
  };

  const handleDelete = async (id) => {
      if(window.confirm("Supprimer ce dossier définitivement ?")) await deleteDoc(doc(db, "forms", id));
  };

  // --- GESTION DES QUESTIONS ---
  
  // Ajouter une option à la liste temporaire (QCM)
  const addOptionToList = () => {
      if(!currentOption.trim()) return;
      setQOptionsList([...qOptionsList, currentOption.trim()]);
      setCurrentOption("");
  };

  // Supprimer une option de la liste temporaire
  const removeOptionFromList = (index) => {
      setQOptionsList(qOptionsList.filter((_, i) => i !== index));
  };

  // Valider et ajouter la question complète au formulaire
  const addQuestionToForm = () => {
      if(!qText.trim()) return alert("Veuillez écrire une question.");
      if(qType === 'qcm' && qOptionsList.length < 2) return alert("Il faut au moins 2 options pour un QCM.");
      
      const newQ = {
          id: Date.now(), 
          type: qType, 
          text: qText,
          imageUrl: qImage, // Image d'illustration
          options: qType === 'qcm' ? qOptionsList : [] 
      };

      setFormData({ ...formData, questions: [...formData.questions, newQ] });
      
      // Reset complet du constructeur
      setQText(""); 
      setQImage("");
      setQOptionsList([]);
      setCurrentOption("");
  };

  const deleteQuestionFromForm = (id) => {
      setFormData({ ...formData, questions: formData.questions.filter(q => q.id !== id) });
  };

  // ===============================================
  // VUE 1 : LISTE DES DOSSIERS (ACCUEIL)
  // ===============================================
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
                    <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{form.desc || "Aucune description."}</p>
                    <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between' }}>
                         <span style={{ fontWeight: 'bold' }}>{form.reward}</span>
                         <span className="text-muted" style={{ fontSize: '0.8rem' }}>{form.questions ? form.questions.length : 0} Questions</span>
                    </div>
                </div>
            ))}
        </div>
      );
  }

  // ===============================================
  // VUE 2 : ÉDITEUR COMPLET
  // ===============================================
  return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', height: 'calc(100vh - 150px)' }}>
          
          {/* COLONNE GAUCHE : VISUALISATION & AJOUT */}
          <div className="pro-card" style={{ display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', border: 'none', background: 'transparent', boxShadow: 'none' }}>
              
              {/* 1. LISTE DES QUESTIONS DÉJÀ CRÉÉES */}
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px', marginBottom: '20px' }}>
                  {formData.questions.length === 0 && (
                      <div className="pro-card flex-center" style={{ borderStyle: 'dashed', flexDirection: 'column', padding: '3rem' }}>
                          <LayoutList size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
                          <p className="text-muted">Aucune question dans ce dossier.</p>
                      </div>
                  )}
                  
                  {formData.questions.map((q, i) => (
                      <div key={q.id} className="pro-card" style={{ display: 'flex', gap: '15px', marginBottom: '15px', borderLeft: `4px solid var(--primary)` }}>
                          <div style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.2rem' }}>Q{i+1}</div>
                          <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '600', marginBottom: '5px', fontSize: '1.1rem' }}>{q.text}</div>
                              
                              {/* Illustration si présente */}
                              {q.imageUrl && (
                                  <div style={{ marginBottom: '8px' }}>
                                      <a href={q.imageUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                          <ImageIcon size={14}/> Voir l'image jointe
                                      </a>
                                  </div>
                              )}

                              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                  <span style={{ background: '#334155', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                      {QUESTION_TYPES.find(t => t.id === q.type)?.label}
                                  </span>
                                  
                                  {q.type === 'qcm' && q.options.map((opt, idx) => (
                                      <span key={idx} style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', color: '#cbd5e1' }}>
                                          {opt}
                                      </span>
                                  ))}
                              </div>
                          </div>
                          <button onClick={() => deleteQuestionFromForm(q.id)} className="text-danger" style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={20} /></button>
                      </div>
                  ))}
              </div>

              {/* 2. CONSTRUCTEUR DE QUESTION (NOUVEAU DESIGN) */}
              <div className="pro-card" style={{ border: '1px solid var(--primary)', background: 'rgba(15, 23, 42, 0.95)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <label style={{ color: 'var(--primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Plus size={18}/> NOUVELLE QUESTION
                      </label>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        {QUESTION_TYPES.map(type => (
                            <button 
                                key={type.id} 
                                onClick={() => setQType(type.id)} 
                                style={{ 
                                    padding: '6px 12px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer',
                                    background: qType === type.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                    color: qType === type.id ? '#000' : '#94a3b8',
                                    border: qType === type.id ? 'none' : '1px solid #334155'
                                }}
                            >
                                {type.label}
                            </button>
                        ))}
                      </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {/* CHAMPS COMMUNS */}
                      <input 
                          value={qText} 
                          onChange={e => setQText(e.target.value)} 
                          placeholder="Intitulé de la question..." 
                          style={{ fontSize: '1rem', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid #475569' }}
                      />

                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <ImageIcon size={20} className="text-muted" />
                          <input 
                              value={qImage} 
                              onChange={e => setQImage(e.target.value)} 
                              placeholder="Lien de l'image d'illustration (Optionnel)..." 
                              style={{ flex: 1, fontSize: '0.9rem', background: 'rgba(0,0,0,0.3)', border: '1px solid #334155' }}
                          />
                      </div>

                      {/* SECTION SPÉCIALE QCM */}
                      {qType === 'qcm' && (
                          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '6px', border: '1px dashed #475569' }}>
                              <label style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px', display: 'block' }}>RÉPONSES POSSIBLES :</label>
                              
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                                  {qOptionsList.map((opt, i) => (
                                      <span key={i} style={{ background: 'var(--primary)', color: '#000', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                          {opt}
                                          <button onClick={() => removeOptionFromList(i)} style={{ border:'none', background:'none', cursor:'pointer', padding:0, display:'flex' }}><X size={14}/></button>
                                      </span>
                                  ))}
                              </div>

                              <div style={{ display: 'flex', gap: '10px' }}>
                                  <input 
                                      value={currentOption} 
                                      onChange={e => setCurrentOption(e.target.value)} 
                                      onKeyDown={e => e.key === 'Enter' && addOptionToList()}
                                      placeholder="Nouvelle option..." 
                                      style={{ flex: 1, background: '#0f172a' }}
                                  />
                                  <button onClick={addOptionToList} className="btn-secondary" style={{ padding: '0 15px' }}><Plus size={18}/></button>
                              </div>
                          </div>
                      )}

                      <button className="btn-main" onClick={addQuestionToForm} style={{ marginTop: '10px' }}>
                          AJOUTER LA QUESTION AU DOSSIER
                      </button>
                  </div>
              </div>
          </div>

          {/* COLONNE DROITE : PARAMÈTRES DU DOSSIER */}
          <div className="pro-card" style={{ height: 'fit-content' }}>
              <h3 className="tech-font mb-4">INFOS GÉNÉRALES</h3>
              <div className="input-group"><label>TITRE</label><input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: Recensement" /></div>
              <div className="input-group"><label>DESCRIPTION</label><textarea rows={3} value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} placeholder="Court résumé..." /></div>
              <div className="input-group"><label>RÉCOMPENSE</label><input value={formData.reward} onChange={e => setFormData({...formData, reward: e.target.value})} placeholder="Ex: 1500 $" /></div>
              
              <div className="grid-2">
                  <div className="input-group"><label>COULEUR</label><div style={{ display: 'flex', gap: '5px' }}>{COLOR_OPTIONS.map(c => (<div key={c.value} onClick={() => setFormData({...formData, color: c.value})} style={{ width: '20px', height: '20px', borderRadius: '50%', background: c.value, cursor: 'pointer', border: formData.color === c.value ? '2px solid white' : 'none' }} />))}</div></div>
                  <div className="input-group"><label>ICÔNE</label><select value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})}>{ICON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
              </div>
              
              <hr style={{ borderColor: '#334155', margin: '20px 0' }} />
              <button className="btn-main w-full mb-2" onClick={handleSave}><Save size={18} style={{ marginRight: '8px' }} /> ENREGISTRER TOUT</button>
              <button className="btn-secondary w-full" onClick={() => setEditingId(null)}>ANNULER</button>
          </div>
      </div>
  );
}