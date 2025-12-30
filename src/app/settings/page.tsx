'use client';

import React, { useState } from 'react';
import { useTasks } from '@/context/TaskContext';
import { Trash2, Plus } from 'lucide-react';

export default function SettingsPage() {
  const { categories, addCategory, removeCategory, loading } = useTasks();

  const handleDelete = async (cat: string) => {
    const choice = window.confirm(
      `Delete "${cat}"? \n\nClick OK to move all associated tasks to "Uncategorized".\nClick Cancel to keep the category (or you can use a custom prompt for full deletion).`
    );
    
    if (choice) {
      // For this simple implementation, let's offer a second choice for full delete
      const subChoice = window.confirm(`Move tasks to "Uncategorized"?\n(OK = Move to Uncategorized, Cancel = Delete tasks entirely)`);
      if (subChoice) {
        await removeCategory(cat, 'migrate');
      } else {
        const finalConfirm = window.confirm("Are you SURE you want to DELETE ALL TASKS in this category?");
        if (finalConfirm) {
          await removeCategory(cat, 'delete');
        }
      }
    }
  };

  if (loading) {
    return (
      <main className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
         <h2 style={{ color: 'var(--primary)', letterSpacing: '0.1em' }}>Loading Settings...</h2>
      </main>
    );
  }
  const [newCat, setNewCat] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCat.trim()) {
      addCategory(newCat.trim());
      setNewCat('');
    }
  };

  return (
    <main className="container">
      <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>Settings</h1>
      
      <section className="glass-panel" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <h2 style={{ margin: 0 }}>System Status</h2>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '4px 12px', 
            borderRadius: '100px',
            background: dbConnected ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${dbConnected ? '#22c55e' : '#ef4444'}`,
            color: dbConnected ? '#22c55e' : '#ef4444',
            fontSize: '0.8rem',
            fontWeight: 700,
            textTransform: 'uppercase'
          }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: dbConnected ? '#22c55e' : '#ef4444' 
            }} />
            {dbConnected ? 'Cloud Vault Connected' : 'Offline / Local Sync'}
          </div>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {dbConnected 
            ? "Your data is perfectly synced with the master Firestore database." 
            : "The app is currently running in local-first mode. Changes will sync as soon as connectivity is restored."}
        </p>
      </section>

      <section className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
        <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Category Management</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
           Customize the buckets for your tasks. Usually these are your main projects or revenue streams.
        </p>

        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
           <input 
             value={newCat} 
             onChange={e => setNewCat(e.target.value)}
             placeholder="New Category Name..."
             style={{ 
               flex: 1, 
               padding: 'var(--spacing-sm)', 
               background: 'rgba(0,0,0,0.3)', 
               border: '1px solid var(--border-subtle)',
               borderRadius: 'var(--radius-sm)',
               color: 'white'
             }}
           />
           <button type="submit" className="btn btn-primary">Add</button>
        </form>

         <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
            {categories.map(cat => (
              <div key={cat} style={{ 
                padding: '8px 16px', 
                background: 'rgba(255,184,0,0.05)', 
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                border: '1px solid var(--accent)'
              }}>
                 <span style={{ fontWeight: 600 }}>{cat}</span>
                 <button 
                   onClick={() => handleDelete(cat)}
                   style={{ 
                     background: 'none', 
                     border: 'none', 
                     color: 'var(--danger)', 
                     cursor: 'pointer', 
                     display: 'flex',
                     alignItems: 'center',
                     opacity: 0.7,
                     transition: 'opacity 0.2s'
                   }}
                   onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                   onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
                   title="Delete Category"
                 >
                   <Trash2 size={16} />
                 </button>
              </div>
            ))}
         </div>
      </section>
    </main>
  );
}
