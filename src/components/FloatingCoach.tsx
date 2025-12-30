'use client';

import React, { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';

type Persona = 'Hormozi' | 'Bandler' | 'ChrisDo';
interface Wisdom {
  text: string;
  persona: Persona;
}

const KNOWLEDGE_BASE: Wisdom[] = [
  // Hormozi
  { text: "If you can't articulate the value, you haven't done the math.", persona: 'Hormozi' },
  { text: "Volume negates luck. Do more.", persona: 'Hormozi' },
  // Bandler
  { text: "Stop. Are you doing this because it works, or because you've always done it?", persona: 'Bandler' },
  { text: "Confusion is the gateway to a new understanding.", persona: 'Bandler' },
  // Chris Do
  { text: "Don't charge for hours, charge for value.", persona: 'ChrisDo' },
];

export default function FloatingCoach() {
  const [isOpen, setIsOpen] = useState(false);
  const [wisdom, setWisdom] = useState<Wisdom>(KNOWLEDGE_BASE[0]);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    // Pulse every 30s to simulate "Pattern Interrupt"
    const interval = setInterval(() => {
       setPulse(true);
       setTimeout(() => setPulse(false), 2000);
       // Change wisdom randomly
       setWisdom(KNOWLEDGE_BASE[Math.floor(Math.random() * KNOWLEDGE_BASE.length)]);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'var(--bg-panel)',
          border: '2px solid var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 50,
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          animation: pulse ? 'pulse 2s infinite' : 'none',
          transition: 'transform 0.2s',
          color: 'var(--primary)'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1.0)'}
      >
        <Brain size={32} />
      </div>

      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '100px',
          right: '30px',
          width: '300px',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid var(--primary)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--spacing-md)',
          zIndex: 50,
          backdropFilter: 'blur(10px)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          animation: 'slideUp 0.3s ease-out'
        }}>
          <div style={{ 
            fontSize: '0.75rem', 
            textTransform: 'uppercase', 
            color: 'var(--text-muted)', 
            marginBottom: '4px',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>Strategic Advisor</span>
            <span style={{ color: 'var(--primary)' }}>{wisdom.persona}</span>
          </div>
          <p style={{ 
            fontStyle: 'italic', 
            fontSize: '1rem', 
            lineHeight: '1.5',
            color: 'var(--text-primary)' 
          }}>
            "{wisdom.text}"
          </p>
        </div>
      )}
      
      <style jsx global>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(245, 158, 11, 0); }
          100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
