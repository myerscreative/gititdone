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
            {[0, 1, 2].map((index) => {
              const task = daily3[index];
              return (
                <div key={index} className={`${styles.slotWrapper} ${task ? styles.activeSlot : ''}`}>
                  <div className={styles.slotLabel}>Mission Slot 0{index + 1}</div>
                  
                  {task ? (
                    <div 
                      className={styles.activeCard}
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className={styles.cardContent}>
                        <div className={styles.cardTitle}>{task.title}</div>
                        <div className={styles.cardMeta}>
                          <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{task.category}</span>
                          <span style={{ opacity: 0.3 }}>•</span>
                          <span>Leverage Score: {task.calculatedScore}</span>
                        </div>
                      </div>
                      <div className={styles.actions}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveMagicTask(task); setIsMagicOpen(true); }}
                          className="btn"
                          style={{ fontSize: '1.4rem', padding: '8px', background: 'transparent' }}
                          title="Scripting Assistant"
                        >
                          🔮
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleDaily3(task.id); }}
                          className={styles.deferBtn}
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
                  ) : (
                    <Link href="/vault" className={styles.emptySlotText}>
                      <span style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>+</span>
                      Deploy High-Leverage Mission from Vault
                    </Link>
                  )}
                </div>
              );
            })}
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
