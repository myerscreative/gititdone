'use client';

import React, { useState } from 'react'
import { useTasks } from '@/context/TaskContext'
import Link from 'next/link'
import styles from './Dashboard.module.css'
import { Task } from '@/types/task'
import TaskDetailDrawer from '@/components/TaskDetailDrawer'
import DailyRealityCheck from '@/components/DailyRealityCheck'
import MagicWordsModal from '@/components/MagicWordsModal'

export default function Home() {
  const { tasks, toggleDaily3, toggleComplete, loading } = useTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isMagicOpen, setIsMagicOpen] = useState(false);
  const [activeMagicTask, setActiveMagicTask] = useState<Task | null>(null);

  if (loading) {
    return (
      <main className="container">
        <div className={styles.dashboard} style={{ justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <h2 style={{ color: 'var(--primary)', letterSpacing: '0.1em' }}>Syncing with Vault...</h2>
        </div>
      </main>
    );
  }

  const daily3 = tasks.filter(t => t.isDaily3 && !t.completed);
  const completedToday = tasks.filter(t => t.completed && new Date(t.createdAt).toDateString() === new Date().toDateString()).length;

  return (
    <main className="container">
       <div className={styles.dashboard}>
          <div className={styles.intro}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Your Daily 3</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Focus. Execution. Speed.<br/>
              <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Tasks Completed Today: {completedToday}</span>
            </p>
          </div>

          <div className={styles.dailyList}>
            {loading && tasks.length === 0 && (
              <div style={{ color: 'var(--accent)', fontSize: '0.9rem', textAlign: 'center', margin: '1rem', animation: 'pulse 2s infinite' }}>
                🔄 Syncing Active Missions...
              </div>
            )}
            {daily3.length === 0 && !loading ? (
              <div className={styles.emptyState}>
                <h3>No Active Tasks</h3>
                <p style={{ margin: '1rem 0', color: 'var(--text-secondary)' }}>
                  Your list is empty. Go to the Vault and pick the top 3 highest leverage activities.
                </p>
                <Link href="/vault" className="btn btn-primary">
                   Open Vault
                </Link>
              </div>
            ) : (
              daily3.map(task => (
                <div 
                  key={task.id} 
                  className={styles.activeCard}
                  onClick={() => setSelectedTask(task)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.cardContent}>
                    <div className={styles.cardTitle}>{task.title}</div>
                    <div className={styles.cardMeta}>
                      {task.category} • Importance: {task.calculatedScore}
                    </div>
                  </div>
                  <div className={styles.actions}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveMagicTask(task); setIsMagicOpen(true); }}
                      className="btn"
                      style={{ fontSize: '1.2rem', padding: '4px 8px', background: 'transparent' }}
                      title="Scripting Assistant"
                    >
                      🔮
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleDaily3(task.id); }}
                      className="btn"
                      style={{ background: 'transparent', color: 'var(--text-muted)' }}
                    >
                      Defer
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleComplete(task.id); }}
                      className={styles.completeBtn}
                    >
                      Complete
                    </button>
                  </div>
                </div>
              ))
            )}
            
            {daily3.length > 0 && daily3.length < 3 && (
               <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                 <Link href="/vault" className="btn" style={{ background: 'var(--bg-card)' }}>
                   + Select Next Task ({3 - daily3.length} remaining)
                 </Link>
               </div>
            )}
          </div>
          <DailyRealityCheck />
       </div>

       {/* Detail Drawer */}
       {selectedTask && (
         <TaskDetailDrawer 
           task={selectedTask} 
           onClose={() => setSelectedTask(null)} 
         />
       )}

       <MagicWordsModal 
         isOpen={isMagicOpen} 
         onClose={() => setIsMagicOpen(false)} 
         context={activeMagicTask?.title} 
       />
    </main>
  )
}
