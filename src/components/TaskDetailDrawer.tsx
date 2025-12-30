'use client';

import React, { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import styles from './TaskDetailDrawer.module.css';
import { X, Sparkles } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { useTasks } from '@/context/TaskContext';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';

interface Props {
  task: Task;
  onClose: () => void;
}

type Note = {
  id: string;
  content: string;
  createdAt: number;
};

export default function TaskDetailDrawer({ task: initialTask, onClose }: Props) {
  const { tasks, updateTask, user, categories } = useTasks();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Always use the latest task from the global context list
  const task = tasks.find(t => t.id === initialTask.id) || initialTask;
  
  // Local state for inputs - these are the source of truth while the drawer is open
  const [localScores, setLocalScores] = useState(task.scoreVariables || { outcome: 5, certainty: 5, delay: 5, effort: 5 });
  const [localTitle, setLocalTitle] = useState(task.title);
  const [localCategory, setLocalCategory] = useState(task.category);

  // Sync from background ONLY when the task ID changes (switching tasks)
  // or if the task was updated via another mechanism (not this drawer)
  // but for now, let's keep it simple: once open, the user is the master.
  useEffect(() => {
    setLocalTitle(task.title);
    setLocalCategory(task.category);
    setLocalScores(task.scoreVariables);
  }, [task.id]); // ONLY on ID change

  const handleScoreChange = (field: keyof typeof localScores, value: string) => {
    const val = parseFloat(value);
    if (isNaN(val)) return;

    const newScores = { ...localScores, [field]: val };
    setLocalScores(newScores);
    
    // Auto-save to context/db
    updateTask(task.id, { scoreVariables: newScores });
  };

  const handleTitleChange = (newTitle: string) => {
    setLocalTitle(newTitle);
    updateTask(task.id, { title: newTitle });
  };

  const handleCategoryChange = (newCat: string) => {
    setLocalCategory(newCat);
    updateTask(task.id, { category: newCat });
  };

  // Firestore Listener for Notes Subcollection
  useEffect(() => {
    if (!task.id) return;

    // Path: tasks/{taskId}/notes
    const q = query(
      collection(db, 'tasks', task.id, 'notes')
    );

    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const loadedNotes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Note[];
      
      // Sort locally to avoid index requirement
      const sorted = loadedNotes.sort((a,b) => b.createdAt - a.createdAt);
      console.log(`📋 Synced ${sorted.length} notes for task ${task.id}`);
      setNotes(sorted);
    });

    return () => unsubscribe();
  }, [task.id]);

  const handleAddNote = async () => {
    if (!newNote.trim() || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      if (!user) {
        console.error("No authenticated user found for adding notes");
        return;
      }
      console.log("📤 Adding progress log for task:", task.id);
      await addDoc(collection(db, 'tasks', task.id, 'notes'), {
        content: newNote.trim(),
        createdAt: Date.now(),
        userId: user.uid
      });
      setNewNote('');
    } catch (e) {
      console.error("Failed to add note", e);
      alert("Error saving note. Check connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className={styles.drawerOverlay} onClick={onClose} />
      <div className={styles.drawer}>
        
        {/* Header */}
        <div className={styles.header} style={{ padding: '24px' }}>
          <div style={{ flex: 1 }}>
            <div className={styles.meta} style={{ marginBottom: '4px' }}>
              <select 
                value={localCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent)',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  padding: 0,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {categories.map(c => <option key={c} value={c} style={{ background: 'var(--bg-card)', color: 'white' }}>{c}</option>)}
                <option value="Uncategorized" style={{ background: 'var(--bg-card)', color: 'white' }}>UNCATEGORIZED</option>
              </select>
            </div>
            <input 
              className={styles.titleInput}
              value={localTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Task Title..."
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '1.8rem',
                fontWeight: 800,
                padding: 0,
                outline: 'none',
                marginBottom: '4px'
              }}
            />
            <div className={styles.meta} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
               <span>Currently Ranked: <span style={{ color: '#fff', fontWeight: 700 }}>{task.calculatedScore}</span></span>
               
               {/* Tools */}
               <div style={{ display: 'flex', gap: '8px' }}>
                 <button 
                    onClick={() => {
                      const instructions = "You are a world-class sales scripting assistant. Help me write a script for: " + task.title;
                      // In a real app this would open a modal, for now alert or log
                      alert("Opening Scripting Assistant for: " + task.title); 
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      color: 'var(--text-secondary)',
                      fontSize: '0.7rem',
                      cursor: 'pointer'
                    }}
                 >
                   SCRIPTING
                 </button>
                 <button 
                    onClick={() => alert("Pattern Interrupt Triggered!")}
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      color: 'var(--text-secondary)',
                      fontSize: '0.7rem',
                      cursor: 'pointer'
                    }}
                 >
                   PATTERN INT.
                 </button>
               </div>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={28} />
          </button>
        </div>

        <div className={styles.content} style={{ padding: '24px' }}>
          {/* Math Visualization (Editable) */}
          <div className={styles.mathWell}>
            <div className={styles.sectionTitle}>Leverage Equation</div>
            <div className={styles.mathGrid}>
              <div className={styles.mathItem}>
                <label className={styles.mathLabel}>Outcome (1-10)</label>
                <input 
                  type="number" 
                  className={styles.mathInput}
                  value={localScores.outcome}
                  onChange={(e) => handleScoreChange('outcome', e.target.value)}
                  min="1" max="100" // Flexible range
                />
              </div>
              <div className={styles.mathItem}>
                <label className={styles.mathLabel}>Certainty (1-10)</label>
                <input 
                  type="number" 
                  className={styles.mathInput}
                  value={localScores.certainty}
                  onChange={(e) => handleScoreChange('certainty', e.target.value)}
                />
              </div>
              <div className={styles.mathItem}>
                <label className={styles.mathLabel}>Time Delay (1-10)</label>
                <input 
                  type="number" 
                  className={styles.mathInput}
                  style={{ color: '#EF4444' }}
                  value={localScores.delay}
                  onChange={(e) => handleScoreChange('delay', e.target.value)}
                />
              </div>
              <div className={styles.mathItem}>
                <label className={styles.mathLabel}>Effort (1-10)</label>
                <input 
                  type="number" 
                  className={styles.mathInput}
                  style={{ color: '#EF4444' }}
                  value={localScores.effort}
                  onChange={(e) => handleScoreChange('effort', e.target.value)}
                />
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', opacity: 0.3 }} />

          {/* Magic Words Section */}
          {task.magicWords && (
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <div className={styles.sectionTitle}>Execution Script</div>
              <div className={styles.magicWordsBox} style={{ marginTop: 0 }}>
                <div className={styles.magicWordsTitle}>
                  <Sparkles size={16} color="var(--primary)" /> 
                  <span>Mindset Shift / Magic Words</span>
                </div>
                <p style={{ fontStyle: 'italic', fontSize: '1rem', color: '#fff', margin: 0 }}>
                  "{task.magicWords}"
                </p>
              </div>
            </div>
          )}

          {/* Notes Section */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className={styles.sectionTitle}>Progress Log</div>
            
            <div className={styles.notesList}>
              {notes.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.95rem' }}>
                  No updates yet. Start a log...
                </div>
              ) : (
                notes.map(note => {
                  const content = note.content.toLowerCase();
                  const isRedAlert = content.includes('expensive') || content.includes('price');
                  return (
                    <div key={note.id} className={`${styles.noteItem} ${isRedAlert ? styles.redAlert : ''}`}>
                      <span className={styles.noteTime}>
                        {new Date(note.createdAt).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                        })}
                      </span>
                      {note.content}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Note Input (Fixed at bottom) */}
        <div className={styles.noteInputArea}>
          <textarea
            className={styles.noteInput}
            placeholder="Log an update (e.g. 'Left voicemail', 'Sent proposal')..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddNote();
              }
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
             <button 
               className={styles.addLogBtn}
               onClick={handleAddNote}
               disabled={isSubmitting || !newNote.trim()}
             >
               {isSubmitting ? 'Saving...' : 'Add Log'}
             </button>
          </div>
        </div>

      </div>
    </>
  );
}
