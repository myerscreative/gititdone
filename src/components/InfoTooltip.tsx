'use client';

import React, { useState, useEffect } from 'react';
import { Info, X } from 'lucide-react';

interface InfoTooltipProps {
  title: string;
  content: string;
}

export default function InfoTooltip({ title, content }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '0',
          marginLeft: '6px',
          display: 'inline-flex',
          alignItems: 'center',
          color: 'var(--text-muted)',
          opacity: 0.6,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.color = 'var(--primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.6';
          e.currentTarget.style.color = 'var(--text-muted)';
        }}
        title={`Learn about ${title}`}
      >
        <Info size={14} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              zIndex: 9998,
              backdropFilter: 'blur(4px)',
            }}
            onClick={(e) => {
              e.preventDefault();
              setIsOpen(false);
            }}
          />
          
          {/* Modal */}
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'var(--bg-card)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-xl)',
              maxWidth: '500px',
              width: '90%',
              zIndex: 9999,
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-lg)' }}>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 600, 
                color: 'var(--primary)',
                margin: 0,
                letterSpacing: 'normal',
                textTransform: 'none',
                fontFamily: 'inherit'
              }}>
                {title}
              </h3>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: 0.6,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                type="button"
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ 
              color: 'var(--text-secondary)', 
              lineHeight: '1.7',
              fontSize: '1rem',
              fontWeight: 400,
              textTransform: 'none',
              letterSpacing: 'normal',
              fontFamily: 'inherit'
            }}>
              {content}
            </div>
          </div>
        </>
      )}
    </>
  );
}

