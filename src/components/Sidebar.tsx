'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Archive, Settings, BrainCircuit, Sparkles, CloudCheck, CloudUpload } from 'lucide-react'
import styles from './Sidebar.module.css'
import { useTasks } from '@/context/TaskContext'

export default function Sidebar() {
  const pathname = usePathname()
  const { isSyncing } = useTasks()

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Brain Dump', path: '/brain-dump', icon: <Sparkles size={20} /> },
    { name: 'Strategist', path: '/intake', icon: <BrainCircuit size={20} /> },
    { name: 'The Vault', path: '/vault', icon: <Archive size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ]

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <Image 
          src="/daily3_logo.svg" 
          alt="Daily 3" 
          width={63} 
          height={21}
          priority
          style={{ height: 'auto', width: 'auto', maxWidth: '63px' }}
        />
      </div>
      
      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive = pathname === item.path
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
      <div style={{ marginTop: 'auto', padding: '0 24px', marginBottom: 'var(--spacing-md)' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: '0.8rem',
          color: isSyncing ? 'var(--primary)' : 'var(--text-muted)',
          transition: 'all 0.3s ease'
        }}>
          {isSyncing ? (
            <>
              <CloudUpload size={16} className="animate-pulse" />
              <span style={{ fontWeight: 700, letterSpacing: '0.05em' }}>SYNCING TO VAULT...</span>
            </>
          ) : (
            <>
              <CloudCheck size={16} style={{ color: 'var(--accent)' }} />
              <span style={{ opacity: 0.7 }}>All Changes Saved</span>
            </>
          )}
        </div>
      </div>

      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', paddingBottom: 'var(--spacing-md)' }}>
        v1.0 Contractor
      </div>
    </aside>
  )
}
