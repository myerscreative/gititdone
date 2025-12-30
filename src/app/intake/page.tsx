'use client';

import React, { useState } from 'react';
import { useTasks } from '@/context/TaskContext';
import { generateActionPlan, GeneratedTask } from '@/app/actions/gemini';
import { Brain, ArrowRight, Check, Sparkles } from 'lucide-react';
import LeverageBadge from '@/components/LeverageBadge';
import styles from './Intake.module.css';
import { useRouter } from 'next/navigation';

export default function IntakePage() {
  const { addTask, addCategory, categories, loading: syncLoading } = useTasks();
  const router = useRouter();

  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<GeneratedTask[]>([]);
  const [committed, setCommitted] = useState(false);

  if (syncLoading) {
    return (
      <main className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
         <h2 style={{ color: 'var(--primary)', letterSpacing: '0.1em' }}>Syncing Brain Trust...</h2>
      </main>
    );
  }

  const handleAnalyze = async () => {
    if (!goal.trim()) return;
    setLoading(true);
    setPlan([]);
    try {
      const results = await generateActionPlan(goal, categories);
      setPlan(results);
    } catch (e) {
      alert("AI Brainstorm failed. Check console or API Key.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = () => {
    // Add all tasks to Vault
    plan.forEach(t => {
      // Ensure category exists
      addCategory(t.category || 'Uncategorized');
      // Add task with scores (we estimate vars from score)
      // Validate and clamp the score to prevent NaN
      const rawScore = Number(t.hormoziScore);
      const est = isNaN(rawScore) ? 5 : Math.min(Math.max(rawScore, 1), 10);
      addTask(t.title, t.category || 'Uncategorized', {
        outcome: est,
        certainty: 9,
        delay: 5,
        effort: 5
      }, t.magicWords || '');
    });
    setCommitted(true);
    setTimeout(() => {
       router.push('/vault');
    }, 1500);
  };

  return (
    <main className="container">
      <h1 style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Brain size={32} color="var(--primary)" /> 
        Strategic Intake
      </h1>

      <section className="glass-panel" style={{ padding: 'var(--spacing-xl)' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: 'var(--spacing-md)' }}>What's the goal?</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
           Dump your brain. Explain the outcome you want, the constraints, and the assets you have. 
           The AI Strategist (Chris Do + Hormozi) will break it down.
        </p>

        <textarea 
          className={styles.textArea} 
          value={goal}
          onChange={e => setGoal(e.target.value)}
          placeholder="e.g. I need to launch a new high-ticket offer for my consulting business by next Friday..."
        />
        
        <button 
          className={`btn btn-primary ${styles.analyzeBtn}`} 
          onClick={handleAnalyze}
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Analyzing Strategy...' : (
             <>Analyze & Generate Plan <Sparkles size={18} /></>
          )}
        </button>
      </section>

      {/* Review Section */}
      {plan.length > 0 && !committed && (
        <section className={styles.resultsGrid}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <h3>Proposed Action Plan ({plan.length} Tasks)</h3>
             <button className="btn btn-primary" onClick={handleCommit}>
               Commit All to Vault <ArrowRight size={18} />
             </button>
           </div>
           
           {plan.map((task, i) => (
             <div key={i} className={styles.resultCard} style={{ animationDelay: `${i * 0.1}s` }}>
               <div style={{ flex: 1 }}>
                 <div className={styles.cardHeader}>
                   <div className={styles.cardTitle}>{task.title}</div>
                   <div className={styles.cardMeta}>
                     {task.category}
                   </div>
                 </div>
                 {task.magicWords && (
                    <div className={styles.magicBox}>
                       🔮 "{task.magicWords}"
                    </div>
                 )}
               </div>
               <LeverageBadge score={task.hormoziScore} />
             </div>
           ))}
        </section>
      )}

      {committed && (
        <div style={{ 
          marginTop: 'var(--spacing-xl)', 
          padding: '2rem', 
          background: 'rgba(16, 185, 129, 0.1)', 
          border: '1px solid var(--accent)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
          color: 'var(--accent)',
          fontSize: '1.2rem',
          fontWeight: 700
        }}>
           <Check size={32} style={{ display: 'block', margin: '0 auto 1rem' }} />
           Plan Committed to Vault! Redirecting...
        </div>
      )}
    </main>
  );
}
