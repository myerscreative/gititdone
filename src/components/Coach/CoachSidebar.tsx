'use client';

import { useState, useEffect } from 'react';
import { useTasks } from '@/context/TaskContext';
import { Zap, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Persona = 'Chris Do' | 'Alex Hormozi' | 'Richard Bandler';

const PERSONAS: Record<Persona, { title: string; color: string }> = {
  'Chris Do': { title: 'The Strategist', color: '#ef4444' },
  'Alex Hormozi': { title: 'Acquisition.com', color: '#f59e0b' },
  'Richard Bandler': { title: 'The Hypnotist', color: '#3b82f6' },
};

export default function CoachSidebar() {
  const { tasks } = useTasks();
  const dailyTaskCount = tasks.filter(t => t.isDaily3 && !t.completed).length;
  const [currentPersona] = useState<Persona>('Alex Hormozi');
  const [advice, setAdvice] = useState<string>("Ready to work?");

  useEffect(() => {
    let msg = "";
    if (currentPersona === 'Alex Hormozi') {
      if (dailyTaskCount === 0) msg = "You have zero leverage right now. Fill the slots. Volume negates luck.";
      else if (dailyTaskCount < 3) msg = `You have ${3 - dailyTaskCount} slot${3 - dailyTaskCount > 1 ? 's' : ''} open. Why leave capacity on the table?`;
      else msg = "Good. Now do the boring work. Success is doing what you said you would do.";
    } else if (currentPersona === 'Chris Do') {
      if (dailyTaskCount === 0) msg = "What is the one thing that moves the needle?";
      else msg = "Is this work priced correctly?";
    } else {
      msg = "Are you sure that's what you want to do?";
    }
    setAdvice(msg);
  }, [dailyTaskCount, currentPersona]);

  const progressPercent = (dailyTaskCount / 3) * 100;
  const isFull = dailyTaskCount === 3;

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #0B1120 0%, #0F172A 100%)',
      borderLeft: '1px solid rgba(255,255,255,0.08)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      
      {/* Header - Strategic Mode */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(16, 185, 129, 0.05)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <Zap size={14} style={{ color: '#10b981' }} />
          <span style={{
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#10b981',
          }}>
            Strategic Mode
          </span>
        </div>
      </div>

      {/* Main Advice Area */}
      <div style={{ flex: 1, padding: '24px 20px', overflow: 'auto' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={advice}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '20px',
            }}
          >
            {/* Quote */}
            <p style={{
              fontSize: '15px',
              fontWeight: 500,
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.9)',
              margin: 0,
              fontStyle: 'italic',
            }}>
              "{advice}"
            </p>
            
            {/* Attribution */}
            <div style={{
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: PERSONAS[currentPersona].color,
              }} />
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.4)',
              }}>
                {PERSONAS[currentPersona].title}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Daily 3 Progress Footer */}
      <div style={{
        padding: '20px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(0,0,0,0.3)',
      }}>
        {/* Header Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingUp size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.35)',
            }}>
              Daily 3 Status
            </span>
          </div>
          <span style={{
            fontSize: '14px',
            fontWeight: 900,
            color: isFull ? '#10b981' : '#f59e0b',
          }}>
            {dailyTaskCount}/3
          </span>
        </div>

        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: '6px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '3px',
          overflow: 'hidden',
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              height: '100%',
              background: isFull 
                ? 'linear-gradient(90deg, #10b981, #34d399)' 
                : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
              borderRadius: '3px',
            }}
          />
        </div>

        {/* Status Text */}
        <p style={{
          marginTop: '10px',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.3)',
          textAlign: 'center',
        }}>
          {isFull ? '✓ All slots filled' : `${3 - dailyTaskCount} slot${3 - dailyTaskCount > 1 ? 's' : ''} available`}
        </p>
      </div>
    </div>
  );
}
