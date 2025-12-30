'use client';

import React, { useState } from 'react'
import { useTasks } from '@/context/TaskContext'
import { TaskCategory, HormoziScore, Task } from '@/types/task'
import styles from './Vault.module.css'
import MagicWordsModal from '@/components/MagicWordsModal'
import LeverageBadge from '@/components/LeverageBadge'
import TaskDetailDrawer from '@/components/TaskDetailDrawer'
import SyncIndicator from '@/components/SyncIndicator'

// const CATEGORIES removed (using context)

export default function Vault() {
  const { tasks, addTask, deleteTask, calculateScore, toggleDaily3, categories, addCategory, loading } = useTasks();

  // State for Magic Modal
  const [isMagicOpen, setIsMagicOpen] = useState(false);
  const [activeMagicTask, setActiveMagicTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // New Task State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>(''); // Initialize empty or first cat
  
  // Effect to set default category
  React.useEffect(() => {
     if (categories.length > 0 && !category) setCategory(categories[0]);
  }, [categories, category]);

  const handleCategoryChange = async (val: string) => {
    if (val === 'ADD_NEW') {
      const name = prompt("Enter new category name:");
      if (name && name.trim()) {
        await addCategory(name.trim());
        setCategory(name.trim());
      }
    } else {
      setCategory(val);
    }
  };

  const [scoreVars, setScoreVars] = useState<HormoziScore>({
    outcome: 5, certainty: 5, delay: 5, effort: 5
  });

  if (loading) {
     return (
       <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <h2 style={{ color: 'var(--primary)', letterSpacing: '0.1em' }}>Connecting to Vault...</h2>
       </div>
     );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category) return;
    
    // ... logic continues
    addTask(title, category, scoreVars);
    setTitle('');
    setScoreVars({ outcome: 5, certainty: 5, delay: 5, effort: 5 }); // reset scores
  };

  // Sort tasks by Hormozi Score (Strictly high leverage first)
  // Show all incomplete tasks
  const sortedTasks = [...tasks]
    .filter(t => !t.completed)
    .sort((a, b) => b.calculatedScore - a.calculatedScore);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>The Vault</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <SyncIndicator />
          <span style={{ color: 'var(--text-secondary)' }}>
            Backlog: {tasks.length}
          </span>
        </div>
      </header>

      {/* Add Task Form */}
      <section className="glass-panel" style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-xl)' }}>
        <h2 className={styles.sectionTitle}>Add New Opportunity</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Opportunity Title</label>
            <input 
              className={styles.input}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What moves the needle?"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Strategy Category</label>
              <select 
                className={styles.select}
                value={category}
                onChange={e => handleCategoryChange(e.target.value)}
              >
                <option value="" disabled>Select Strategy...</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="ADD_NEW">+ Create New Strategy</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 'var(--spacing-lg)' }}>
               <div style={{ flex: 1 }}>
                  <label className={styles.label}>Projected Value</label>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.05em' }}>
                    {calculateScore(scoreVars).toFixed(1)}
                  </div>
               </div>
               <button type="submit" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '0.9rem' }}>
                  Commit to Vault
               </button>
            </div>
          </div>

          <div className={styles.scoreGrid}>
            <div>
              <label className={styles.label}>Outcome (0-10)</label>
              <input type="number" className={styles.input} value={scoreVars.outcome} onChange={e => setScoreVars({...scoreVars, outcome: parseFloat(e.target.value) || 0})} />
            </div>
             <div>
              <label className={styles.label}>Certainty (0-10)</label>
              <input type="number" className={styles.input} value={scoreVars.certainty} onChange={e => setScoreVars({...scoreVars, certainty: parseFloat(e.target.value) || 0})} />
            </div>
             <div>
              <label className={styles.label}>Delay (Time)</label>
              <input type="number" className={styles.input} value={scoreVars.delay} onChange={e => setScoreVars({...scoreVars, delay: parseFloat(e.target.value) || 1})} />
            </div>
             <div>
              <label className={styles.label}>Effort</label>
              <input type="number" className={styles.input} value={scoreVars.effort} onChange={e => setScoreVars({...scoreVars, effort: parseFloat(e.target.value) || 1})} />
            </div>
          </div>
        </form>
      </section>

      {/* Magic Words Modal */}
      <MagicWordsModal 
        isOpen={isMagicOpen} 
        onClose={() => setIsMagicOpen(false)} 
        context={activeMagicTask?.title} 
      />

      {/* Task List */}
      <h2 className={styles.sectionTitle}>High-Leverage Backlog</h2>
      <div className={styles.taskList}>
        {sortedTasks.map(task => (
          <div 
            key={task.id} 
            className={styles.taskCard} 
            onClick={() => setSelectedTask(task)}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ flex: 1 }}>
              <div className={styles.taskTitle}>{task.title}</div>
              <div className={styles.taskMeta}>
                <span className={styles.categoryTag}>{task.category}</span>
                <span style={{ opacity: 0.2 }}>|</span>
                <LeverageBadge score={task.calculatedScore} />
              </div>
            </div>
            <div 
              style={{ display: 'flex', gap: '16px', alignItems: 'center' }}
              onClick={(e) => e.stopPropagation()} 
            >
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveMagicTask(task); setIsMagicOpen(true); }}
                  className="btn"
                  style={{ fontSize: '1.4rem', padding: '0', background: 'transparent', opacity: 0.6 }}
                  title="Scripting Assistant"
                >
                  🔮
                </button>
                {!task.isDaily3 && !task.completed && (
                   <button 
                     onClick={(e) => { e.stopPropagation(); toggleDaily3(task.id); }}
                     className={styles.promoteBtn}
                   >
                     Promote to Daily 3
                   </button>
                )}
                {task.isDaily3 && (
                    <span style={{ color: 'var(--accent)', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Active in Daily 3</span>
                )}
               <button 
                  onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                  className={styles.deleteBtn}
                  title="Delete"
                >
                  ×
                </button>
            </div>
          </div>
        ))}
        {sortedTasks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            The Vault is empty. Add high-leverage tasks above.
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {selectedTask && (
        <TaskDetailDrawer 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)} 
        />
      )}
    </div>
  )
}
