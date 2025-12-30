'use client';

import React, { useState } from 'react';
import { useTasks } from '@/context/TaskContext';
import styles from './BrainDump.module.css';
import { Sparkles, Brain, Check, Trash2, ArrowRight } from 'lucide-react';
import { parseBulkTasks, GeneratedTask } from '@/app/actions/gemini';
import LeverageBadge from '@/components/LeverageBadge';

export default function BrainDump() {
  const { categories, addTask, addCategory, loading: contextLoading, authLoading } = useTasks();
  const [bulkText, setBulkText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsedTasks, setParsedTasks] = useState<GeneratedTask[]>([]);
  const [localNewCategories, setLocalNewCategories] = useState<string[]>([]);
  const [committing, setCommitting] = useState(false);
  const [committed, setCommitted] = useState(false);

  const handleTriage = async () => {
    if (!bulkText.trim()) return;
    setParsing(true);
    setParsedTasks([]);
    setLocalNewCategories([]);
    try {
      const results = await parseBulkTasks(bulkText, categories);
      setParsedTasks(results);
      
      // Identify any AI-suggested categories that aren't in the global list
      const suggested = results.map(r => r.category).filter(cat => !categories.includes(cat));
      setLocalNewCategories(Array.from(new Set(suggested)));
    } catch (e: any) {
      alert("The Strategic Brain is resetting. Please try again in a moment.");
      console.error(e);
    } finally {
      setParsing(false);
    }
  };

  const handleCommit = async () => {
    if (committing || parsedTasks.length === 0) return;
    setCommitting(true);
    console.log("🚀 Starting Batch Commit to Vault...");
    
    try {
      // 1. Identify all used categories that are NOT in the global Firestore list
      const usedCategories = Array.from(new Set(parsedTasks.map(t => t.category)));
      const categoriesToPersist = usedCategories.filter(cat => !categories.includes(cat));
      console.log(`📂 Categories to persist: ${categoriesToPersist.length}`, categoriesToPersist);

      // 2. Persist them first
      for (const cat of categoriesToPersist) {
        console.log(`➕ Persisting new category: ${cat}`);
        await addCategory(cat);
      }

      // 3. Add each task to Firestore
      console.log(`📤 Committing ${parsedTasks.length} tasks...`);
      for (const t of parsedTasks) {
        const est = Math.min(t.hormoziScore, 10);
        console.log(`   -> Adding task: ${t.title}`);
        await addTask(t.title, t.category, { 
          outcome: est, 
          certainty: 9, 
          delay: 5, 
          effort: 5 
        }, t.magicWords);
      }
      
      console.log("✅ Batch Commit Successful!");
      setCommitted(true);
      setParsedTasks([]);
      setLocalNewCategories([]);
      setBulkText('');
      setTimeout(() => setCommitted(false), 5000);
    } catch (e) {
      console.error("❌ Batch commit failed:", e);
      alert("Batch commit failed. Please check your connection and try again.");
    } finally {
      setCommitting(false);
    }
  };

  const removeParsedTask = (index: number) => {
    setParsedTasks(parsedTasks.filter((_, i) => i !== index));
  };

  const updateParsedTaskCategory = (index: number, newCat: string) => {
    const updated = [...parsedTasks];
    if (newCat === 'ADD_NEW') {
      const name = prompt("Enter new category name:");
      if (name) {
        updated[index].category = name;
        // Add to local session categories so other cards see it
        if (!categories.includes(name) && !localNewCategories.includes(name)) {
          setLocalNewCategories([...localNewCategories, name]);
        }
      }
    } else {
      updated[index].category = newCat;
    }
    setParsedTasks(updated);
  };

  const updateParsedTaskTitle = (index: number, newTitle: string) => {
    const updated = [...parsedTasks];
    updated[index].title = newTitle;
    setParsedTasks(updated);
  };

  if (authLoading) {
    return (
      <main className="container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <h2 style={{ color: 'var(--primary)', letterSpacing: '0.1em' }}>Opening Brain Trust...</h2>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>
        <Sparkles size={32} color="var(--primary)" style={{ verticalAlign: 'middle', marginRight: '12px' }} />
        AI Brain Dump
      </h1>

      <section className="glass-panel" style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-2xl)' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: 'var(--spacing-md)', color: 'var(--text-secondary)' }}>
          Dump your thoughts, emails, or messy to-do lists here.
        </h2>
        {contextLoading && !categories.length && (
          <div style={{ fontSize: '0.8rem', color: 'var(--accent)', marginBottom: '8px', animation: 'pulse 2s infinite' }}>
            🔄 Syncing Project Categories...
          </div>
        )}
        <textarea
          className={styles.bulkTextarea}
          placeholder="e.g. I need to fix the patio door leak, send the NILUMI proposal to John, and follow up on the CRM leads from last week..."
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          disabled={parsing || committing}
        />
        <button 
          className={styles.processBtn}
          onClick={handleTriage}
          disabled={parsing || !bulkText.trim() || committing}
        >
          {parsing ? 'Architecting Tasks...' : (
            <>AI Triage <Brain size={20} /></>
          )}
        </button>
      </section>

      {/* Review Grid */}
      {parsedTasks.length > 0 && (
        <section className={styles.reviewGrid}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Draft Triage ({parsedTasks.length})</h2>
            <button className={styles.commitBtn} style={{ width: 'auto', padding: '12px 24px', marginTop: 0 }} onClick={handleCommit} disabled={committing}>
              {committing ? 'Saving to Vault...' : <>Commit All to Vault <Check size={20} /></>}
            </button>
          </div>

          {parsedTasks.map((task, i) => (
            <div key={i} className={styles.reviewCard}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <select 
                    className={styles.catDropdown}
                    value={(categories.includes(task.category) || localNewCategories.includes(task.category)) ? task.category : 'OTHER'}
                    onChange={(e) => updateParsedTaskCategory(i, e.target.value)}
                    style={{
                      background: 'rgba(255,184,0,0.1)',
                      border: '1px solid var(--accent)',
                      color: 'var(--accent)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                      cursor: 'pointer'
                    }}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    {localNewCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="ADD_NEW">+ ADD NEW</option>
                  </select>
                </div>
                <input 
                  value={task.title}
                  onChange={(e) => updateParsedTaskTitle(i, e.target.value)}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid transparent',
                    color: 'white',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    padding: '2px 0',
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderBottom = '1px solid var(--accent)')}
                  onBlur={(e) => (e.target.style.borderBottom = '1px solid transparent')}
                />
                {task.magicWords && (
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
                    🔮 "{task.magicWords}"
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <LeverageBadge score={task.hormoziScore} />
                <button 
                  onClick={() => removeParsedTask(i)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                >
                  <Trash2 size={20} />
                </button>
              </div>
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
          fontWeight: 700,
          animation: 'slideUp 0.3s ease-out'
        }}>
           <Check size={32} style={{ display: 'block', margin: '0 auto 1rem' }} />
           Success! All tasks committed to The Vault.
        </div>
      )}
    </main>
  );
}
