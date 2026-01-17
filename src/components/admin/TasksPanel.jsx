import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { Trash2, Plus, Save, Zap, Target } from 'lucide-react';

export default function TasksPanel() {
  const [tasks, setTasks] = useState([]);
  
  // Formulaire d'ajout
  const [newTask, setNewTask] = useState({ 
    text: '', 
    reward: 50, 
    tag: 'ADMIN', 
    targetField: '' // Optionnel : ex "info.telephone"
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "rapid_tasks"), (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleAdd = async () => {
    if (!newTask.text) return alert("Question requise");
    
    await addDoc(collection(db, "rapid_tasks"), {
      ...newTask,
      type: 'text', // Par défaut pour les tâches rapides
      createdAt: new Date().toISOString()
    });
    
    setNewTask({ text: '', reward: 50, tag: 'ADMIN', targetField: '' });
  };

  const handleDelete = async (id) => {
    if(window.confirm("Supprimer cette tâche ?")) {
      await deleteDoc(doc(db, "rapid_tasks", id));
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px' }}>
        
        {/* LISTE DES TÂCHES EXISTANTES */}
        <div className="pro-card">
            <h3 className="tech-font text-cyan mb-4">TÂCHES ACTIVES ({tasks.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '70vh', overflowY: 'auto' }}>
                {tasks.map(task => (
                    <div key={task.id} style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '6px',
                        borderLeft: '4px solid var(--success)'
                    }}>
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{task.text}</div>
                            <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem', color: '#94a3b8', marginTop: '5px' }}>
                                <span style={{ color: 'var(--success)' }}>+{task.reward} $</span>
                                <span style={{ background: '#334155', padding: '0 6px', borderRadius: '4px' }}>{task.tag}</span>
                                {task.targetField && <span style={{ color: 'var(--warning)' }}>Auto-Update: {task.targetField}</span>}
                            </div>
                        </div>
                        <button onClick={() => handleDelete(task.id)} className="btn-danger" style={{ padding: '8px' }}>
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
                {tasks.length === 0 && <p className="text-muted">Aucune tâche rapide configurée.</p>}
            </div>
        </div>

        {/* AJOUTER UNE TÂCHE */}
        <div className="pro-card" style={{ height: 'fit-content', borderLeft: '4px solid var(--success)' }}>
            <h3 className="tech-font mb-4">NOUVELLE TÂCHE</h3>
            
            <div className="input-group">
                <label>QUESTION</label>
                <textarea 
                    rows={3}
                    value={newTask.text} 
                    onChange={e => setNewTask({...newTask, text: e.target.value})}
                    placeholder="Ex: Quel est votre numéro de téléphone ?"
                />
            </div>

            <div className="grid-2">
                <div className="input-group">
                    <label>GAIN ($)</label>
                    <input 
                        type="number" 
                        value={newTask.reward} 
                        onChange={e => setNewTask({...newTask, reward: parseInt(e.target.value)})}
                    />
                </div>
                <div className="input-group">
                    <label>TAG</label>
                    <input 
                        value={newTask.tag} 
                        onChange={e => setNewTask({...newTask, tag: e.target.value})}
                        placeholder="Ex: RH, ADMIN"
                    />
                </div>
            </div>

            <div className="input-group">
                <label style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Target size={14}/> CIBLE (OPTIONNEL)
                </label>
                <input 
                    value={newTask.targetField} 
                    onChange={e => setNewTask({...newTask, targetField: e.target.value})}
                    placeholder="Ex: info.telephone (Met à jour le profil)"
                    style={{ borderColor: newTask.targetField ? 'var(--warning)' : '#334155' }}
                />
                <small className="text-muted">Si rempli, la réponse du joueur remplacera automatiquement cette info dans son profil.</small>
            </div>

            <button className="btn-main w-full mt-4" onClick={handleAdd}>
                <Plus size={18} style={{ marginRight: '8px' }} /> AJOUTER AU FLUX
            </button>
        </div>
    </div>
  );
}