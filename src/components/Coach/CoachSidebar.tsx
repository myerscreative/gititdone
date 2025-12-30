'use client';

import { useState, useEffect } from 'react';
import { useTasks } from '@/context/TaskContext';
import { Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Persona = 'Chris Do' | 'Alex Hormozi' | 'Richard Bandler';

const PERSONAS: Record<Persona, { title: string; style: string }> = {
  'Chris Do': {
    title: 'The Strategist',
    style: 'Socratic, design-focused, value-based pricing mindset.',
  },
  'Alex Hormozi': {
    title: 'Acquisition.com',
    style: 'Volume, leverage, offer creation, simple math.',
  },
  'Richard Bandler': {
    title: 'The Hypnotist',
    style: 'Pattern interrupt, NLP, changing submodalities.',
  }
};

export default function CoachSidebar() {
  const { tasks } = useTasks();
  const dailyTaskCount = tasks.filter(t => t.isDaily3 && !t.completed).length;
  
  // Persona cycles automatically based on task state for variety
  const [currentPersona] = useState<Persona>('Alex Hormozi');
  const [advice, setAdvice] = useState<string>("Ready to work?");

  useEffect(() => {
    let msg = "";

    if (currentPersona === 'Alex Hormozi') {
        if (dailyTaskCount === 0) msg = "You have zero leverage right now. Fill the slots. Volume negates luck.";
        else if (dailyTaskCount < 3) msg = `You have ${3 - dailyTaskCount} slots open. Why leave capacity on the table? Maximize your daily output.`;
        else msg = "Good. Now do the boring work. Success is doing what you said you would do.";
    } else if (currentPersona === 'Chris Do') {
        if (dailyTaskCount === 0) msg = "What is the one thing that moves the needle? Don't just be busy, be effective.";
        else msg = "Is this work priced correctly? Are you solving a big enough problem for your client?";
    } else {
        // Bandler
        msg = "Are you sure that's what you want to do? Or is that just a picture in your head you're reacting to?";
    }
    
    setAdvice(msg);
  }, [dailyTaskCount, currentPersona]);

  return (
    <div className="h-full flex flex-col bg-[#0B1120] border-l border-white/10">
      
      {/* Strategic Mode Indicator */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest">
          <Activity size={12} className="text-emerald-500 animate-pulse" />
          <span className="text-emerald-500/80 font-bold">Strategic Mode: Active</span>
        </div>
      </div>

      {/* Advice Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div 
              key={advice}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white/[0.03] border border-white/10 p-5 rounded-lg"
          >
              <p className="text-sm text-white/80 leading-relaxed">"{advice}"</p>
              <p className="text-[10px] text-white/30 mt-3 uppercase tracking-wider">— {PERSONAS[currentPersona].title}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Daily 3 Progress */}
      <div className="p-5 border-t border-white/5 bg-black/30">
        <div className="flex items-center justify-between text-[10px] mb-2">
          <span className="text-white/30 uppercase font-bold tracking-wider">Daily 3 Status</span>
          <span className={dailyTaskCount === 3 ? 'text-emerald-400 font-black' : 'text-amber-400 font-black'}>
            {dailyTaskCount}/3
          </span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            className={dailyTaskCount === 3 ? 'h-full bg-emerald-500' : 'h-full bg-amber-500'}
            initial={{ width: 0 }}
            animate={{ width: `${(dailyTaskCount / 3) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
}
