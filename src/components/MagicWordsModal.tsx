'use client';

import React, { useState } from 'react';
import styles from './MagicWords.module.css';

interface MagicProps {
  isOpen: boolean;
  onClose: () => void;
  context?: string; // e.g. "Call John about the patio"
}

// Phil M. Jones "Magic Words" Templates
const MAGIC_TEMPLATES = [
  {
    trigger: "Rejection-Proof Opening",
    phrase: "I'm not sure if it's for you, but...",
    usage: "Use this to potential introduce an option without pressure."
  },
  {
    trigger: "Qualification",
    phrase: "How open-minded would you be to...",
    usage: "Use this to gauge interest in a new idea or meeting."
  },
  {
    trigger: "Guidance / Next Steps",
    phrase: "What happens next is...",
    usage: "Use this to take control of the process and lead the prospect."
  },
  {
    trigger: "Decision Making",
    phrase: "Just imagine...",
    usage: "Use this to help them visualize the benefit of the outcome."
  },
  {
    trigger: "Urgency (Polite)",
    phrase: "When would be a good time to...",
    usage: "Use this to schedule action without demanding 'now'."
  }
];

export default function MagicWordsModal({ isOpen, onClose, context }: MagicProps) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
    }}>
      <div className="glass-panel" style={{ width: '600px', maxWidth: '90%', maxHeight: '80vh', overflowY: 'auto', padding: 'var(--spacing-lg)', border: '1px solid var(--primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--primary)', textTransform: 'uppercase' }}>🔮 Scripting Assistant</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>

        {context && (
          <div className={styles.instruction}>
            <strong>Context:</strong> {context}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {MAGIC_TEMPLATES.map((t, i) => (
            <div key={i}>
              <div className={styles.triggerTag}>
                {t.trigger}
              </div>
              <div className={styles.quoteBox}>
                "{t.phrase}"
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {t.usage}
              </div>
            </div>
          ))}
        </div>
        
        <div style={{ marginTop: 'var(--spacing-lg)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Inspired by Phil M. Jones "Exactly What to Say"
        </div>
      </div>
    </div>
  );
}
