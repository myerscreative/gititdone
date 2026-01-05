'use client';

import React, { useState, useEffect } from 'react'
import { useTasks } from '@/context/TaskContext'
import Link from 'next/link'
import styles from './Dashboard.module.css'
import { Task } from '@/types/task'
import TaskDetailDrawer from '@/components/TaskDetailDrawer'
import MagicWordsModal from '@/components/MagicWordsModal'
import SyncIndicator from '@/components/SyncIndicator'
import { Reorder, AnimatePresence, motion } from 'framer-motion'
import { GripVertical, Check, Sparkles, TrendingUp } from 'lucide-react'

export default function Home() {
  const { tasks, toggleDaily3, toggleComplete, reorderDaily3, loading, getStreak } = useTasks();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isMagicOpen, setIsMagicOpen] = useState(false);
  const [activeMagicTask, setActiveMagicTask] = useState<Task | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  
  // Local state for ordered Daily 3 tasks
  const [orderedDaily3, setOrderedDaily3] = useState<Task[]>([]);

  // Get Daily 3 tasks sorted by their order
  const daily3FromContext = tasks
    .filter(t => t.isDaily3 && !t.completed)
    .sort((a, b) => (a.daily3Order ?? 999) - (b.daily3Order ?? 999));

  // Get completed Daily 3 tasks from today
  const completedTodayTasks = tasks.filter(t => {
    if (!t.completed || !t.completedAt) return false;
    const completedDate = new Date(t.completedAt).toDateString();
    const today = new Date().toDateString();
    return completedDate === today;
  }).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

  // Sync local state with context (only when context changes)
  useEffect(() => {
    setOrderedDaily3(daily3FromContext);
  }, [tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track previous Daily 3 count to detect when we complete the last one
  const [prevDaily3Count, setPrevDaily3Count] = useState(orderedDaily3.length);
  
  useEffect(() => {
    setPrevDaily3Count(orderedDaily3.length);
  }, [orderedDaily3.length]);

  // Check for completion celebration
  useEffect(() => {
    // Celebrate when we go from having tasks to 0, and we've completed at least 3 today
    if (prevDaily3Count > 0 && orderedDaily3.length === 0 && completedTodayTasks.length >= 3 && !showCelebration) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 5000);
    }
  }, [orderedDaily3.length, prevDaily3Count, completedTodayTasks.length, showCelebration]);

  const handleReorder = (newOrder: Task[]) => {
    setOrderedDaily3(newOrder);
  };

  const handleDragEnd = () => {
    // Persist the new order to Firestore
    const orderedIds = orderedDaily3.map(t => t.id);
    reorderDaily3(orderedIds);
  };

  const handleComplete = async (taskId: string) => {
    setCompletingTaskId(taskId);
    await toggleComplete(taskId);
    setTimeout(() => setCompletingTaskId(null), 600);
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

  const completedToday = completedTodayTasks.length;
  const streak = getStreak();
  const emptySlots = Math.max(0, 3 - orderedDaily3.length);
  
  // Get top tasks from vault for suggestions
  const topVaultTasks = tasks
    .filter(t => !t.isDaily3 && !t.completed)
    .sort((a, b) => b.calculatedScore - a.calculatedScore)
    .slice(0, 3);

  return (
    <main className="container">
       <div className={styles.dashboard}>
          <div className={styles.intro}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1>Your Daily 3</h1>
              <SyncIndicator />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
              <p className={styles.subtitle}>
                {completedToday > 0 ? `${completedToday} completed today` : 'Focus. Execute. Ship.'}
              </p>
              {streak > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 700 }}>
                  <TrendingUp size={14} />
                  {streak} day{streak !== 1 ? 's' : ''} streak
                </div>
              )}
            </div>
          </div>

          {/* Completion Celebration */}
          <AnimatePresence>
            {showCelebration && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={styles.celebration}
              >
                <Sparkles size={32} />
                <h2>All 3 Complete! 🎉</h2>
                <p>You're crushing it today!</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reorderable Daily 3 List */}
          <Reorder.Group 
            axis="y" 
            values={orderedDaily3} 
            onReorder={handleReorder}
            className={styles.dailyList}
          >
            <AnimatePresence>
              {orderedDaily3.map((task, index) => (
                <Reorder.Item 
                  key={task.id} 
                  value={task}
                  onDragEnd={handleDragEnd}
                  className={`${styles.slotWrapper} ${styles.activeSlot} ${completingTaskId === task.id ? styles.completing : ''}`}
                  style={{ cursor: 'grab' }}
                  whileDrag={{ 
                    scale: 1.02, 
                    boxShadow: '0 10px 40px rgba(245, 158, 11, 0.2)',
                    cursor: 'grabbing'
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: -100 }}
                  transition={{ duration: 0.3 }}
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
                      <div className={`${styles.cardTitle} ${completingTaskId === task.id ? styles.strikethrough : ''}`}>
                        {task.title}
                      </div>
                      <div className={styles.cardMeta}>
                        <span className={styles.categoryTag}>{task.category}</span>
                        <span className={styles.leverageBadge}>{task.calculatedScore.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className={styles.actions}>
                      {completingTaskId === task.id ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1, rotate: 360 }}
                          transition={{ duration: 0.5 }}
                          style={{ color: 'var(--accent)', fontSize: '1.5rem' }}
                        >
                          <Check size={24} />
                        </motion.div>
                      ) : (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleDaily3(task.id); }}
                            className={styles.deferBtn}
                          >
                            Defer
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleComplete(task.id); }}
                            className={styles.completeBtn}
                          >
                            Done
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>

          {/* Empty Slots */}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <div key={`empty-${i}`} className={styles.slotWrapper}>
              <div className={styles.slotLabel}>0{orderedDaily3.length + i + 1}</div>
              {topVaultTasks.length > 0 && i === 0 ? (
                <div className={styles.emptySlotWithSuggestions}>
                  <Link href="/vault" className={styles.emptySlot}>
                    <span className={styles.emptyPlus}>+</span>
                    <span>Add from Vault</span>
                  </Link>
                  <div className={styles.suggestions}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Suggested:</span>
                    {topVaultTasks.slice(0, 2).map(task => (
                      <button
                        key={task.id}
                        onClick={() => toggleDaily3(task.id)}
                        className={styles.suggestionBtn}
                      >
                        {task.title}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <Link href="/vault" className={styles.emptySlot}>
                  <span className={styles.emptyPlus}>+</span>
                  <span>Add from Vault</span>
                </Link>
              )}
            </div>
          ))}

          {/* Completed Tasks Section */}
          {completedTodayTasks.length > 0 && (
            <div style={{ marginTop: 'var(--spacing-xl)' }}>
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: 'var(--spacing-md)'
                }}
              >
                <span>Completed Today ({completedTodayTasks.length})</span>
                <span style={{ transform: showCompleted ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
              </button>
              {showCompleted && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={styles.completedSection}
                >
                  {completedTodayTasks.map(task => (
                    <div key={task.id} className={styles.completedTask}>
                      <Check size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                      <span style={{ textDecoration: 'line-through', opacity: 0.6 }}>{task.title}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        {task.completedAt ? new Date(task.completedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}
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

       <MagicWordsModal 
         isOpen={isMagicOpen} 
         onClose={() => setIsMagicOpen(false)} 
         context={activeMagicTask?.title} 
       />
    </main>
  )
}
