'use client';

import React, { useState, useEffect } from 'react';
import { useTasks } from '@/context/TaskContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { generateStateDisruptor } from '@/app/actions/gemini';
import { BrainCircuit, AlertTriangle, Zap } from 'lucide-react';

export default function DailyRealityCheck() {
  const { user, categories } = useTasks();
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [hasLogs, setHasLogs] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchTodayLogs = async () => {
      setLoading(true);
      try {
        // Since we have subcollections, we have two options:
        // 1. Fetch all tasks, then fetch their notes (slow)
        // 2. Use a collectionGroup query (requires firebase index)
        // For "Daily 3", we can just fetch all tasks' notes since there aren't many.
        
        // Let's get tasks updated today or just all tasks (usually < 20-30 in vault)
        const qTasks = query(collection(db, 'tasks'), where('userId', '==', user.uid));
        const tasksSnapshot = await getDocs(qTasks);
        
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const startTimestamp = startOfDay.getTime();

        let todayLogs: string[] = [];

        // Fetch notes for each task (parallel)
        const notePromises = tasksSnapshot.docs.map(async (taskDoc) => {
          const notesQ = query(
            collection(db, 'tasks', taskDoc.id, 'notes'),
            where('createdAt', '>=', startTimestamp)
          );
          const notesSnap = await getDocs(notesQ);
          return notesSnap.docs.map(d => `[${taskDoc.data().category}] ${d.data().content}`);
        });

        const results = await Promise.all(notePromises);
        todayLogs = results.flat();

        setHasLogs(todayLogs.length > 0);
        
        // Analyze with Gemini
        const result = await generateStateDisruptor(todayLogs);
        setAnalysis(result);

      } catch (err) {
        console.error("Reality Check Error:", err);
        setAnalysis("The connection to your reality is broken. Refresh or check your internet.");
      } finally {
        setLoading(false);
      }
    };

    fetchTodayLogs();
  }, [user, categories]);

  if (!user) return null;

  return (
    <div style={{ marginTop: 'var(--spacing-xl)', marginBottom: 'var(--spacing-xl)' }}>
      <div 
        className="glass-panel" 
        style={{ 
          padding: 'var(--spacing-lg)', 
          border: '2px solid rgba(245, 158, 11, 0.4)', // Amber/Gold
          borderLeft: '10px solid #F59E0B', 
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', right: '-20px', top: '-20px', opacity: 0.05 }}>
           <BrainCircuit size={120} color="#F59E0B" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-sm)' }}>
          <Zap color="#F59E0B" size={24} />
          <h3 style={{ margin: 0, color: '#F59E0B', letterSpacing: '0.1em' }}>State Disruptor</h3>
        </div>

        <div style={{ 
          fontSize: '1.2rem', 
          lineHeight: 1.6, 
          color: '#F8FAFC', 
          fontWeight: 600,
          fontStyle: 'italic',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)'
        }}>
          {loading ? (
            <span style={{ color: 'var(--text-muted)' }}>Scanning your performance frequency...</span>
          ) : (
            <>
              "{analysis}"
              {!hasLogs && (
                <div style={{ fontSize: '0.8rem', color: '#F59E0B', marginTop: 'var(--spacing-sm)', textTransform: 'uppercase', fontWeight: 800 }}>
                   ⚠️ Mission Alert: No sensory evidence of progress today.
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ marginTop: 'var(--spacing-md)', display: 'flex', justifyContent: 'flex-end' }}>
           <div style={{ fontSize: '0.7rem', color: 'rgba(245, 158, 11, 0.6)', fontWeight: 800 }}>
              // NEURAL STATE: {hasLogs ? 'CALIBRATED' : 'DISRUPTED'}
           </div>
        </div>
      </div>
    </div>
  );
}
