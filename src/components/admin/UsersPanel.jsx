import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { User, Phone, CreditCard, Briefcase, Eye, Save, Clock, FileText, ChevronDown, ChevronUp } from 'lucide-react';

export default function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [expandedForms, setExpandedForms] = useState({}); // Pour ouvrir/fermer les détails des formulaires

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  const saveUser = async () => {
    if(!selected) return;
    try { await updateDoc(doc(db, "users", selected.id), { info: selected.info }); alert("Profil mis à jour !"); } 
    catch(e) { console.error(e); }
  };

  const toggleForm = (index) => {
    setExpandedForms(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // --- FONCTION DE TRI DES RÉPONSES ---
  const getUserHistory = () => {
      if (!selected?.game?.answers) return { tasks: [], forms: [] };

      const answers = [...selected.game.answers].reverse(); // Plus récent en haut
      const tasks = [];
      const forms = [];

      answers.forEach((item, index) => {
          // On essaie de voir si c'est un formulaire (JSON) ou une tâche simple
          let isForm = false;
          let parsedContent = null;

          if (typeof item.reponse === 'string' && item.reponse.trim().startsWith('{')) {
              try {
                  parsedContent = JSON.parse(item.reponse);
                  isForm = true;
              } catch (e) { isForm = false; }
          }

          const data = { ...item, originalIndex: index, parsedContent };

          if (isForm) forms.push(data);
          else tasks.push(data);
      });

      return { tasks, forms };
  };

  const { tasks, forms } = selected ? getUserHistory() : { tasks: [], forms: [] };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', height: 'calc(100vh - 150px)' }}>
      
      {/* 1. LISTE DES CITOYENS (GAUCHE) */}
      <div className="pro-card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
         <div style={{ padding: '15px', borderBottom: '1px solid #334155', background: 'rgba(0,0,0,0.2)' }}>
            <h4 style={{ margin: 0, color: 'var(--primary)' }}>CITOYENS ({users.length})</h4>
         </div>
         <div style={{ overflowY: 'auto', flex: 1 }}>
            {users.map(u => (
                <div key={u.id} onClick={() => setSelected(u)}
                     style={{ 
                        padding: '12px 15px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)',
                        background: selected?.id === u.id ? 'var(--primary)' : 'transparent',
                        color: selected?.id === u.id ? '#000' : '#fff',
                        transition: 'all 0.2s'
                     }}>
                    <div style={{ fontWeight: 'bold' }}>{u.info?.nom} {u.info?.prenom}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{u.info?.metier || "Sans emploi"}</div>
                </div>
            ))}
         </div>
      </div>

      {/* 2. DÉTAILS DU DOSSIER (DROITE) */}
      {selected ? (
          <div className="pro-card" style={{ overflowY: 'auto', paddingRight: '10px' }}>
              
              {/* EN-TÊTE FIXE */}
              <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '8px' }}>
                  <div className="avatar" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
                      {selected.info?.photoUrl ? <img src={selected.info.photoUrl} alt="" style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover'}}/> : (selected.info?.prenom?.[0] || 'U')}
                  </div>
                  <div style={{ flex: 1 }}>
                      <h1 style={{ margin: 0, fontSize: '2rem' }}>{selected.info?.prenom} {selected.info?.nom}</h1>
                      <div style={{ display: 'flex', gap: '15px', marginTop: '10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><CreditCard size={14}/> {selected.info?.banque || "IBAN Manquant"}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Briefcase size={14}/> {selected.info?.metier || "Chômeur"}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Phone size={14}/> {selected.info?.telephone || "N/A"}</span>
                      </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                      <div className="text-cyan" style={{ fontSize: '2rem', fontFamily: 'Rajdhani', fontWeight: 'bold' }}>{selected.economy?.enAttente || 0} $</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>EN ATTENTE</div>
                  </div>
              </div>

              {/* SECTION 1 : ÉTAT CIVIL COMPLET (Editable) */}
              <h3 className="tech-font text-primary mb-4" style={{ borderBottom: '1px solid #334155', paddingBottom: '10px' }}>/// ÉTAT CIVIL & PHYSIQUE</h3>
              <div className="grid-2 mb-6">
                  <div className="input-group"><label>NOM</label><input value={selected.info?.nom || ''} onChange={e=>setSelected({...selected, info:{...selected.info, nom:e.target.value}})}/></div>
                  <div className="input-group"><label>PRÉNOM</label><input value={selected.info?.prenom || ''} onChange={e=>setSelected({...selected, info:{...selected.info, prenom:e.target.value}})}/></div>
                  <div className="input-group"><label>DATE NAISSANCE</label><input type="date" value={selected.info?.dateNaissance || ''} onChange={e=>setSelected({...selected, info:{...selected.info, dateNaissance:e.target.value}})}/></div>
                  <div className="input-group"><label>MÉTIER</label><input value={selected.info?.metier || ''} onChange={e=>setSelected({...selected, info:{...selected.info, metier:e.target.value}})}/></div>
                  
                  <div className="input-group"><label>SEXE</label><input value={selected.info?.sexe || ''} onChange={e=>setSelected({...selected, info:{...selected.info, sexe:e.target.value}})}/></div>
                  <div className="input-group"><label>PEAU</label><input value={selected.info?.peau || ''} onChange={e=>setSelected({...selected, info:{...selected.info, peau:e.target.value}})}/></div>
                  <div className="input-group"><label>CHEVEUX</label><input value={selected.info?.cheveux || ''} onChange={e=>setSelected({...selected, info:{...selected.info, cheveux:e.target.value}})}/></div>
                  <div className="input-group"><label>BANQUE</label><input value={selected.info?.banque || ''} onChange={e=>setSelected({...selected, info:{...selected.info, banque:e.target.value}})}/></div>
              </div>
              <button className="btn-main mb-6" style={{ width: 'auto', padding: '10px 30px' }} onClick={saveUser}>
                  <Save size={16} style={{ marginRight: '8px' }} /> ENREGISTRER LES MODIFICATIONS
              </button>


              {/* SECTION 2 : DOSSIERS & FORMULAIRES (Complexes) */}
              <h3 className="tech-font text-warning mb-4" style={{ borderBottom: '1px solid #334155', paddingBottom: '10px', marginTop: '2rem' }}>
                  /// ARCHIVES : DOSSIERS REMPLIS ({forms.length})
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '2rem' }}>
                  {forms.length === 0 && <p className="text-muted">Aucun formulaire soumis.</p>}
                  
                  {forms.map((form, idx) => (
                      <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', overflow: 'hidden', border: '1px solid #334155' }}>
                          {/* HEADER FORMULAIRE */}
                          <div 
                              onClick={() => toggleForm(idx)}
                              style={{ 
                                  padding: '15px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                  background: expandedForms[idx] ? 'rgba(255,255,255,0.05)' : 'transparent'
                              }}
                          >
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                  <FileText size={18} color="var(--warning)"/>
                                  <span style={{ fontWeight: 'bold', color: '#e2e8f0' }}>{form.question || "Dossier Inconnu"}</span>
                                  <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                                      - {new Date(form.date).toLocaleDateString()}
                                  </span>
                              </div>
                              {expandedForms[idx] ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                          </div>

                          {/* CONTENU DÉPLIABLE */}
                          {expandedForms[idx] && (
                              <div style={{ padding: '20px', borderTop: '1px solid #334155' }}>
                                  {Object.entries(form.parsedContent).map(([question, answer], i) => (
                                      <div key={i} style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                          <div style={{ fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '5px', fontWeight: 'bold' }}>
                                              {question}
                                          </div>
                                          <div style={{ color: '#fff', fontSize: '0.95rem' }}>
                                              {answer.startsWith('http') ? (
                                                  <a href={answer} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Voir la preuve image</a>
                                              ) : (
                                                  answer
                                              )}
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  ))}
              </div>


              {/* SECTION 3 : TÂCHES RAPIDES (Simples) */}
              <h3 className="tech-font text-cyan mb-4" style={{ borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
                  /// SURVEILLANCE : TÂCHES QUOTIDIENNES ({tasks.length})
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {tasks.length === 0 && <p className="text-muted">Aucune activité récente.</p>}
                  
                  {tasks.map((task, i) => (
                      <div key={i} style={{ 
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px',
                          borderLeft: '2px solid var(--primary)'
                      }}>
                          <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                  {new Date(task.date).toLocaleDateString()} - {task.question}
                              </div>
                              <div style={{ color: '#fff' }}>{task.reponse}</div>
                          </div>
                          {task.tag && <span style={{ fontSize: '0.7rem', background: '#334155', padding: '2px 6px', borderRadius: '4px' }}>{task.tag}</span>}
                      </div>
                  ))}
              </div>

          </div>
      ) : (
          <div className="pro-card flex-center text-muted" style={{ borderStyle: 'dashed', flexDirection: 'column' }}>
              <User size={48} style={{ opacity: 0.2, marginBottom: '20px' }} />
              <div>SÉLECTIONNEZ UN CITOYEN DANS LA LISTE</div>
          </div>
      )}
    </div>
  );
}