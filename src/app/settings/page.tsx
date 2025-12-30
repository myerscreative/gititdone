'use client';

import React, { useState } from 'react';
import { useTasks } from '@/context/TaskContext';
import { Trash2, Plus } from 'lucide-react';

export default function SettingsPage() {
  const { categories, addCategory, removeCategory, loading, dbConnected, user, loginWithGoogle, logout } = useTasks();
  const [newCat, setNewCat] = useState('');
  const [deletingCat, setDeletingCat] = useState<string | null>(null);

  const handleDelete = async (cat: string) => {
    if (deletingCat) return;
    
    const choice = window.confirm(
      `Delete "${cat}"? \n\nClick OK to move all associated tasks to "Uncategorized".\nClick Cancel to keep the category (or you can use a custom prompt for full deletion).`
    );

    if (choice) {
      // For this simple implementation, let's offer a second choice for full delete
      const subChoice = window.confirm(`Move tasks to "Uncategorized"?\n(OK = Move to Uncategorized, Cancel = Delete tasks entirely)`);
      
      setDeletingCat(cat);
      try {
        if (subChoice) {
          await removeCategory(cat, 'migrate');
        } else {
          const finalConfirm = window.confirm("Are you SURE you want to DELETE ALL TASKS in this category?");
          if (finalConfirm) {
            await removeCategory(cat, 'delete');
          }
        }
      } catch (e) {
        console.error("Delete failed", e);
        alert("Delete failed. See console.");
      } finally {
        setDeletingCat(null);
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

        {/* User Identity / Account Management */}
        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
           <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Account Status: <span style={{ color: user?.isAnonymous ? '#f59e0b' : '#22c55e' }}>{user?.isAnonymous ? 'Guest (Temporary)' : 'Verified (Permanent)'}</span>
           </h3>
           
           <code style={{ 
             display: 'block', 
             padding: '10px', 
             background: 'rgba(0,0,0,0.3)', 
             borderRadius: '6px',
             fontSize: '0.8rem',
             color: '#fbbf24',
             border: '1px dashed rgba(251, 191, 36, 0.3)',
             marginBottom: '16px'
           }}>
             ID: {user ? user.uid : 'Not Authenticated'}
             {!user?.isAnonymous && user?.email && <div style={{ color: '#22c55e', marginTop: '4px' }}>Email: {user.email}</div>}
           </code>

           {user?.isAnonymous ? (
             <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
               <h4 style={{ margin: '0 0 8px 0', color: '#f59e0b', fontSize: '0.9rem' }}>⚠️ Prevent Data Loss</h4>
               <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginBottom: '12px' }}>
                 You are currently using a temporary Guest session. If you clear your cookies or switch browsers, <strong>your data will be lost forever.</strong>
               </p>
               <button 
                 onClick={loginWithGoogle}
                 style={{
                   background: '#4285F4',
                   color: 'white',
                   border: 'none',
                   padding: '10px 20px',
                   borderRadius: '6px',
                   fontWeight: 600,
                   cursor: 'pointer',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '8px'
                 }}
               >
                 <svg width="18" height="18" viewBox="0 0 18 18">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fillRule="evenodd" fill="#fff" fillOpacity="1" />
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.836.86-3.048.86-2.344 0-4.328-1.584-5.036-3.715H.957v2.332A8.997 8.997 0 0 0 9 18z" fillRule="evenodd" fill="#fff" fillOpacity="1" />
                    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fillRule="evenodd" fill="#fff" fillOpacity="1" />
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fillRule="evenodd" fill="#fff" fillOpacity="1" />
                 </svg>
                 Sign In with Google
               </button>
             </div>
           ) : (
             <div style={{ marginTop: '16px' }}>
                <button 
                  onClick={logout}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  Sign Out
                </button>
             </div>
           )}
        </div>
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
                   disabled={deletingCat === cat}
                   title={deletingCat === cat ? "Deleting..." : "Delete Category"}
                 >
                   {deletingCat === cat ? (
                     <div className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full" />
                   ) : (
                     <Trash2 size={16} />
                   )}
                 </button>
              </div>
            ))}
         </div>
      </section>
    </main>
  );
}
