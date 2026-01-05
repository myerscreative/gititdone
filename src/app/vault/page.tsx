'use client';

import React, { useState, useRef } from 'react'
import { useTasks } from '@/context/TaskContext'
import { TaskCategory, HormoziScore, Task } from '@/types/task'
import styles from './Vault.module.css'
import MagicWordsModal from '@/components/MagicWordsModal'
import LeverageBadge from '@/components/LeverageBadge'
import TaskDetailDrawer from '@/components/TaskDetailDrawer'
import SyncIndicator from '@/components/SyncIndicator'
import InfoTooltip from '@/components/InfoTooltip'

// const CATEGORIES removed (using context)

export default function Vault() {
  const { tasks, addTask, deleteTask, calculateScore, toggleDaily3, categories, addCategory, loading, user, authLoading } = useTasks();

  // State for Magic Modal
  const [isMagicOpen, setIsMagicOpen] = useState(false);
  const [activeMagicTask, setActiveMagicTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // New Task State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>(''); // Initialize empty or first cat
  const [isReusable, setIsReusable] = useState(false);
  const [isAfterHours, setIsAfterHours] = useState(false);
  const previousCategoryRef = useRef<TaskCategory>('');
  
  // Effect to set default category
  React.useEffect(() => {
     if (categories.length > 0 && (!category || category === '')) {
       setCategory(categories[0]);
       previousCategoryRef.current = categories[0];
     }
  }, [categories]);

  // Update ref when category changes (but not when it's ADD_NEW)
  React.useEffect(() => {
    if (category && category !== 'ADD_NEW') {
      previousCategoryRef.current = category;
    }
  }, [category]);

  const handleCategoryChange = async (val: string) => {
    if (val === 'ADD_NEW') {
      // Check if Firebase is ready
      if (authLoading) {
        alert('Authentication is still loading. Please wait a moment, then try again.\n\n' +
              'If this persists, check:\n' +
              '1. Browser console (F12) for errors\n' +
              '2. Anonymous authentication is enabled in Firebase Console');
        // Reset to previous category
        const currentCat = category || previousCategoryRef.current || (categories.length > 0 ? categories[0] : '');
        setCategory(currentCat);
        return;
      }
      
      if (!user) {
        const errorMsg = authLoading 
          ? 'Authentication is still loading. Please wait a moment...'
          : 'Authentication failed. Anonymous authentication may not be enabled in Firebase Console.\n\n' +
            'To fix:\n' +
            '1. Go to: https://console.firebase.google.com/project/get-it-done-901f7/authentication/providers\n' +
            '2. Click "Sign-in method" tab\n' +
            '3. Enable "Anonymous" authentication\n' +
            '4. Refresh this page\n\n' +
            'Check browser console (F12) for more details.';
        alert(errorMsg);
        // Reset to previous category
        const currentCat = category || previousCategoryRef.current || (categories.length > 0 ? categories[0] : '');
        setCategory(currentCat);
        return;
      }
      
      // Store current category before prompt
      const currentCat = category || previousCategoryRef.current || (categories.length > 0 ? categories[0] : '');
      const name = prompt("Enter new category name:");
      if (name && name.trim()) {
        try {
          await addCategory(name.trim());
          // Set the new category - it should appear in the list after Firestore syncs
          setCategory(name.trim());
        } catch (error: any) {
          console.error('Failed to add category:', error);
          const errorMsg = error?.message || 'Unknown error';
          if (errorMsg.includes('not authenticated') || errorMsg.includes('not initialized')) {
            alert('Firebase is not ready yet. Please wait a moment and try again, or refresh the page.');
          } else {
            alert(`Failed to add category: ${errorMsg}`);
          }
          // Reset to previous category
          setCategory(currentCat);
        }
      } else {
        // User cancelled or entered empty string - reset to previous category
        setCategory(currentCat);
      }
    } else {
      setCategory(val);
    }
  };

  const [scoreVars, setScoreVars] = useState<HormoziScore>({
    outcome: 5, certainty: 5, delay: 5, effort: 5
  });

  // Filter state
  const [filterType, setFilterType] = useState<'all' | 'reusable' | 'one-time' | 'after-hours'>('all');

  if (loading) {
     return (
       <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <h2 style={{ color: 'var(--primary)', letterSpacing: '0.1em' }}>Connecting to Vault...</h2>
       </div>
     );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', { title, category, scoreVars });
    
    if (!title.trim()) {
      console.warn('Cannot submit: title is empty');
      alert('Please enter an opportunity title.');
      return;
    }
    
    if (!category || category.trim() === '') {
      console.warn('Cannot submit: category is empty');
      alert('Please select a strategy category.');
      return;
    }
    
    try {
      console.log('Calling addTask with:', { title, category, scoreVars, isReusable, isAfterHours });
      await addTask(title.trim(), category, scoreVars, undefined, isReusable, isAfterHours);
      console.log('Task added successfully');
      // Only reset if successful
      setTitle('');
      setIsReusable(false);
      setIsAfterHours(false);
      setScoreVars({ outcome: 5, certainty: 5, delay: 5, effort: 5 }); // reset scores
    } catch (error: any) {
      console.error('Failed to add task:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      alert(`Failed to add task: ${errorMessage}`);
    }
  };

  // Filter and sort tasks
  const filteredTasks = tasks.filter(t => {
    if (t.completed) return false;
    if (filterType === 'reusable') return t.isReusable === true && !t.isAfterHours;
    if (filterType === 'one-time') return !t.isReusable && !t.isAfterHours;
    return !t.isAfterHours; // 'all' excludes After Hours (they have their own section)
  });

  // Separate into reusable and one-time
  const reusableTasks = filteredTasks.filter(t => t.isReusable).sort((a, b) => b.calculatedScore - a.calculatedScore);
  const oneTimeTasks = filteredTasks.filter(t => !t.isReusable).sort((a, b) => b.calculatedScore - a.calculatedScore);
  
  // After Hours tasks (separate section)
  const afterHoursTasks = tasks
    .filter(t => !t.completed && t.isAfterHours)
    .sort((a, b) => b.calculatedScore - a.calculatedScore);
  
  // For 'all' view, combine but show reusable first
  const sortedTasks = filterType === 'all' 
    ? [...reusableTasks, ...oneTimeTasks]
    : filteredTasks.sort((a, b) => b.calculatedScore - a.calculatedScore);

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
              <label className={styles.label} style={{ display: 'flex', alignItems: 'center' }}>
                Strategy Category
                <InfoTooltip 
                  title="Strategy Category"
                  content="Organize your tasks by strategic area or business function. Categories help you see where you're focusing your energy and identify gaps. Examples: Income Generation, Product Development, Marketing, Operations. Create categories that match your business priorities."
                />
              </label>
              <select 
                className={styles.select}
                value={category && categories.includes(category) ? category : ''}
                onChange={e => handleCategoryChange(e.target.value)}
                key={categories.length} // Force re-render when categories change
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
              <label className={styles.label} style={{ display: 'flex', alignItems: 'center' }}>
                Outcome (0-10)
                <InfoTooltip 
                  title="Outcome"
                  content="Rate the potential impact or result this task will create on a scale of 0-10. Higher scores mean bigger outcomes. Ask yourself: 'If I complete this perfectly, how much will it move the needle?' Examples: A task that generates $10K/month = 9-10, a task that saves 1 hour/week = 3-4."
                />
              </label>
              <input type="number" className={styles.input} value={scoreVars.outcome} onChange={e => setScoreVars({...scoreVars, outcome: parseFloat(e.target.value) || 0})} />
            </div>
             <div>
              <label className={styles.label} style={{ display: 'flex', alignItems: 'center' }}>
                Certainty (0-10)
                <InfoTooltip 
                  title="Certainty"
                  content="How confident are you that this approach will actually work? Rate from 0-10. Higher scores mean you're more certain it will succeed. Consider: Have you done this before? Do you have a proven system? Is it experimental? A proven system you've used = 8-10, a new untested idea = 3-5."
                />
              </label>
              <input type="number" className={styles.input} value={scoreVars.certainty} onChange={e => setScoreVars({...scoreVars, certainty: parseFloat(e.target.value) || 0})} />
            </div>
             <div>
              <label className={styles.label} style={{ display: 'flex', alignItems: 'center' }}>
                Delay (Time)
                <InfoTooltip 
                  title="Delay"
                  content="How long until you see results from this task? Lower numbers = faster results. This measures time-to-impact. Examples: Sending an email = 1 (immediate), launching a product = 8-10 (months), a quick sales call = 2-3 (days to close). The formula divides by delay, so faster results = higher leverage score."
                />
              </label>
              <input type="number" className={styles.input} value={scoreVars.delay} onChange={e => setScoreVars({...scoreVars, delay: parseFloat(e.target.value) || 1})} />
            </div>
             <div>
              <label className={styles.label} style={{ display: 'flex', alignItems: 'center' }}>
                Effort
                <InfoTooltip 
                  title="Effort"
                  content="How much work, time, or energy does this task require? Lower numbers = less effort. Be honest about the actual time investment. Examples: A 5-minute email = 1-2, a full day project = 7-8, a multi-week initiative = 9-10. The formula divides by effort, so less effort = higher leverage score."
                />
              </label>
              <input type="number" className={styles.input} value={scoreVars.effort} onChange={e => setScoreVars({...scoreVars, effort: parseFloat(e.target.value) || 1})} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'var(--spacing-md)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={isReusable}
                onChange={(e) => setIsReusable(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Reusable item (will stay in Vault after use)
              </span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={isAfterHours}
                onChange={(e) => {
                  setIsAfterHours(e.target.checked);
                  // Can't be both reusable and After Hours
                  if (e.target.checked) setIsReusable(false);
                }}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.85rem', color: '#a5b4fc' }}>
                🌙 After Hours (shows only after Daily 3 complete)
              </span>
            </label>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>High-Leverage Backlog</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterType('all')}
            className={filterType === 'all' ? styles.filterBtnActive : styles.filterBtn}
          >
            All ({tasks.filter(t => !t.completed && !t.isAfterHours).length})
          </button>
          <button
            onClick={() => setFilterType('reusable')}
            className={filterType === 'reusable' ? styles.filterBtnActive : styles.filterBtn}
          >
            Reusable ({reusableTasks.length})
          </button>
          <button
            onClick={() => setFilterType('one-time')}
            className={filterType === 'one-time' ? styles.filterBtnActive : styles.filterBtn}
          >
            One-Time ({oneTimeTasks.length})
          </button>
          <button
            onClick={() => setFilterType('after-hours')}
            className={filterType === 'after-hours' ? styles.filterBtnActiveAfterHours : styles.filterBtnAfterHours}
          >
            🌙 After Hours ({afterHoursTasks.length})
          </button>
        </div>
      </div>
      <div className={styles.taskList}>
        {(filterType === 'after-hours' ? afterHoursTasks : sortedTasks).map(task => (
          <div 
            key={task.id} 
            className={styles.taskCard} 
            onClick={() => setSelectedTask(task)}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div className={styles.taskTitle}>{task.title}</div>
                {task.isReusable && (
                  <span className={styles.reusableBadge} title="Reusable item">
                    🔄 Reusable
                  </span>
                )}
              </div>
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
                {!task.isDaily3 && !task.completed && !task.isAfterHours && (
                   <button 
                     onClick={(e) => { e.stopPropagation(); toggleDaily3(task.id); }}
                     className={styles.promoteBtn}
                   >
                     Promote to Daily 3
                   </button>
                )}
                {task.isAfterHours && (
                  <span style={{ color: '#a5b4fc', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    🌙 After Hours
                  </span>
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
        {(filterType === 'after-hours' ? afterHoursTasks : sortedTasks).length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            {filterType === 'after-hours' 
              ? 'No After Hours tasks yet. Add some optional tasks that will appear after you complete your Daily 3.'
              : 'The Vault is empty. Add high-leverage tasks above.'}
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
