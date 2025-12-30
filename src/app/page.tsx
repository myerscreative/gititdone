'use client';

import React, { useState, useEffect } from 'react'
import { useTasks } from '@/context/TaskContext'
import Link from 'next/link'
import styles from './Dashboard.module.css'
import { Task } from '@/types/task'
import TaskDetailDrawer from '@/components/TaskDetailDrawer'
import MagicWordsModal from '@/components/MagicWordsModal'
import SyncIndicator from '@/components/SyncIndicator'
import { Reorder } from 'framer-motion'
import { GripVertical } from 'lucide-react'

export default function Home() {
  const { tasks, toggleDaily3, toggleComplete, reorderDaily3, loading } = useTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isMagicOpen, setIsMagicOpen] = useState(false);
  const [activeMagicTask, setActiveMagicTask] = useState<Task | null>(null);
  
  // Local state for ordered Daily 3 tasks
  const [orderedDaily3, setOrderedDaily3] = useState<Task[]>([]);

  // Get Daily 3 tasks sorted by their order
  const daily3FromContext = tasks
    .filter(t => t.isDaily3 && !t.completed)
    .sort((a, b) => (a.daily3Order ?? 999) - (b.daily3Order ?? 999));

  // Sync local state with context (only when context changes)
  useEffect(() => {
    setOrderedDaily3(daily3FromContext);
  }, [tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReorder = (newOrder: Task[]) => {
    setOrderedDaily3(newOrder);
  };

  const handleDragEnd = () => {
    // Persist the new order to Firestore
    const orderedIds = orderedDaily3.map(t => t.id);
    reorderDaily3(orderedIds);
  };

  if (loading) {
    return (
      <main className="container">
        <div className={styles.dashboard} style={{ justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <h2 style={{ color: 'var(--primary)', letterSpacing: '0.1em' }}>Syncing with Vault...</h2>
        </div>
      </main>
    );
  }

  const completedToday = tasks.filter(t => t.completed && new Date(t.createdAt).toDateString() === new Date().toDateString()).length;
  const emptySlots = Math.max(0, 3 - orderedDaily3.length);

  return (
    <main className="container">
       <div className={styles.dashboard}>
          <div className={styles.intro}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1>Your Daily 3</h1>
              <SyncIndicator />
            </div>
            <p className={styles.subtitle}>
              {completedToday > 0 ? `${completedToday} completed today` : 'Focus. Execute. Ship.'}
            </p>
          </div>

          {/* Reorderable Daily 3 List */}
          <Reorder.Group 
            axis="y" 
            values={orderedDaily3} 
            onReorder={handleReorder}
            className={styles.dailyList}
          >
            {orderedDaily3.map((task, index) => (
              <Reorder.Item 
                key={task.id} 
                value={task}
                onDragEnd={handleDragEnd}
                className={`${styles.slotWrapper} ${styles.activeSlot}`}
                style={{ cursor: 'grab' }}
                whileDrag={{ 
                  scale: 1.02, 
                  boxShadow: '0 10px 40px rgba(245, 158, 11, 0.2)',
                  cursor: 'grabbing'
                }}
              >
                <div className={styles.slotLabel}>0{index + 1}</div>
                
                {/* Drag Handle */}
                <div className={styles.dragHandle}>
                  <GripVertical size={18} />
                </div>
                
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
              </Reorder.Item>
            ))}
          </Reorder.Group>

          {/* Empty Slots */}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <div key={`empty-${i}`} className={styles.slotWrapper}>
              <div className={styles.slotLabel}>0{orderedDaily3.length + i + 1}</div>
              <Link href="/vault" className={styles.emptySlot}>
                <span className={styles.emptyPlus}>+</span>
                <span>Add from Vault</span>
              </Link>
            </div>
          ))}
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
