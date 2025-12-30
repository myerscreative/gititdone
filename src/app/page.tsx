'use client';

import React, { useState } from 'react'
import { useTasks } from '@/context/TaskContext'
import Link from 'next/link'
import styles from './Dashboard.module.css'
import { Task } from '@/types/task'
import TaskDetailDrawer from '@/components/TaskDetailDrawer'
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
            <h1>Your Daily 3</h1>
            <p className={styles.subtitle}>
              {completedToday > 0 ? `${completedToday} completed today` : 'Focus. Execute. Ship.'}
            </p>
          </div>

          <div className={styles.dailyList}>
            {[0, 1, 2].map((index) => {
              const task = daily3[index];
              return (
                <div key={index} className={`${styles.slotWrapper} ${task ? styles.activeSlot : ''}`}>
                  <div className={styles.slotLabel}>0{index + 1}</div>
                  
                  {task ? (
                    <div 
                      className={styles.activeCard}
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className={styles.cardContent}>
                        <div className={styles.cardTitle}>{task.title}</div>
                        <div className={styles.cardMeta}>
                          <span className={styles.categoryTag}>{task.category}</span>
                          <span className={styles.leverageBadge}>{task.calculatedScore.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className={styles.actions}>
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
                          Done
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Link href="/vault" className={styles.emptySlot}>
                      <span className={styles.emptyPlus}>+</span>
                      <span>Add from Vault</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
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
