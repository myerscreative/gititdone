'use client';

import React, { useState } from 'react'
import { useTasks } from '@/context/TaskContext'
import { TaskCategory, HormoziScore, Task } from '@/types/task'
import styles from './Vault.module.css'
import MagicWordsModal from '@/components/MagicWordsModal'
import LeverageBadge from '@/components/LeverageBadge'
import TaskDetailDrawer from '@/components/TaskDetailDrawer'

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
  const sortedTasks = tasks
    .filter(t => !t.completed)
    .sort((a, b) => b.calculatedScore - a.calculatedScore);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>The Vault</h1>
        <div style={{ color: 'var(--text-secondary)' }}>
          Backlog: {tasks.length}
        </div>
      </header>

      {/* Add Task Form */}
      <section className="glass-panel" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: 'var(--spacing-md)' }}>Add New Opportunity</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Task Title</label>
            <input 
              className={styles.input}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What needs to be done?"
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Category</label>
            <select 
              className={styles.select}
              value={category}
              onChange={e => handleCategoryChange(e.target.value)}
            >
              <option value="" disabled>Select Category...</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="ADD_NEW">+ ADD NEW</option>
            </select>
          </div>

          {/* Score Inputs Placeholder - To be connected properly next */}
          <div className={styles.scoreGrid}>
             {/* Simple inputs for now to show UI */}
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
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Projected Value: <strong style={{ color: 'var(--accent)' }}>{calculateScore(scoreVars)}</strong>
             </div>
             <button type="submit" className="btn btn-primary">Add to Vault</button>
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
      <div className={styles.taskList}>
        {sortedTasks.map(task => (
          <div 
            key={task.id} 
            className={styles.taskCard} 
            onClick={() => setSelectedTask(task)}
            style={{ cursor: 'pointer' }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '8px' }}>{task.title} <span style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>in {task.category}</span></div>
              <LeverageBadge score={task.calculatedScore} />
            </div>
            <div 
              style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
              onClick={(e) => e.stopPropagation()} // Prevent card click when clicking buttons
            >
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveMagicTask(task); setIsMagicOpen(true); }}
                  className="btn"
                  style={{ fontSize: '1.2rem', padding: '4px 8px', background: 'transparent' }}
                  title="Scripting Assistant"
                >
                  🔮
                </button>
                {!task.isDaily3 && !task.completed && (
                   <button 
                     onClick={(e) => { e.stopPropagation(); toggleDaily3(task.id); }}
                     className="btn" 
                     style={{ fontSize: '0.8rem', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary)' }}
                   >
                     Promote to Daily 3
                   </button>
                )}
                {task.isDaily3 && (
                    <span style={{ color: 'var(--accent)', fontSize: '0.8rem', alignSelf: 'center', fontWeight: 'bold' }}>IN DAILY 3</span>
                )}
               <button 
                  onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                  className="btn" 
                  style={{ padding: '4px 8px', color: 'var(--danger)', fontSize: '1.2rem' }}
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
