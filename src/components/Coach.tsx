'use client';

import React, { useState, useEffect } from 'react';
import styles from './Coach.module.css';

type Persona = 'Hormozi' | 'Bandler' | 'ChrisDo';

interface Wisdom {
  text: string;
  persona: Persona;
}

const KNOWLEDGE_BASE: Wisdom[] = [
  // Hormozi (Value Equation & Volume)
  { text: "If you can't articulate the value, you haven't done the math. Calculate the outcome.", persona: 'Hormozi' },
  { text: "Volume negates luck. Do more.", persona: 'Hormozi' },
  { text: "The work works on you more than you work on it.", persona: 'Hormozi' },
  { text: "Decrease the delay. How can you get the result in half the time?", persona: 'Hormozi' },
  
  // Richard Bandler (NLP & Pattern Interrupt)
  { text: "Stop. Are you doing this because it works, or because you've always done it?", persona: 'Bandler' },
  { text: "If you change the way you look at things, the things you look at change.", persona: 'Bandler' },
  { text: "Confusion is the gateway to a new understanding. Get confused.", persona: 'Bandler' },
  { text: "What would happen if you just... didn't do that?", persona: 'Bandler' },

  // Chris Do (Strategy & Mindset)
  { text: "Don't charge for hours, charge for value. What is this worth to them?", persona: 'ChrisDo' },
  { text: "You don't need more clients. You need better clients.", persona: 'ChrisDo' },
  { text: "Is this a $10 task or a $10,000 task? Act accordingly.", persona: 'ChrisDo' },
  { text: "Saying no is the ultimate power move.", persona: 'ChrisDo' },
];

export default function Coach() {
  const [currentWisdom, setCurrentWisdom] = useState<Wisdom>(KNOWLEDGE_BASE[0]);
  const [isAnimating, setIsAnimating] = useState(false);

  const refreshWisdom = () => {
    setIsAnimating(true);
    setTimeout(() => {
      const randomIdx = Math.floor(Math.random() * KNOWLEDGE_BASE.length);
      setCurrentWisdom(KNOWLEDGE_BASE[randomIdx]);
      setIsAnimating(false);
    }, 200);
  };

  // Initialize random
  useEffect(() => {
    refreshWisdom();
  }, []);

  const getPersonaStyle = (p: Persona) => {
    switch (p) {
      case 'Hormozi': return styles.modeHormozi;
      case 'Bandler': return styles.modeBandler;
      case 'ChrisDo': return styles.modeChrisDo;
    }
  };

  const getPersonaLabel = (p: Persona) => {
    switch (p) {
      case 'Hormozi': return 'THE SCALER';
      case 'Bandler': return 'THE HYPNOTIST';
      case 'ChrisDo': return 'THE STRATEGIST';
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.avatar}>🧠</div>
         <div>
            <div className={styles.name}>Antigravity Coach</div>
            <div className={styles.role}>Persistent Mentor</div>
         </div>
      </header>
      
      <div className={styles.messageBox} style={{ opacity: isAnimating ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        <p className={styles.message}>
          "{currentWisdom.text}"
        </p>
      </div>

      <div className={styles.actions}>
        <span className={`${styles.modeTag} ${getPersonaStyle(currentWisdom.persona)}`}>
          {getPersonaLabel(currentWisdom.persona)}
        </span>
        <button className={styles.refreshBtn} onClick={refreshWisdom} title="New Insight">
          ↻
        </button>
      </div>
    </div>
  );
}
