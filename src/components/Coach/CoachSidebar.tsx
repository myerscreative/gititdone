'use client';

import { useState, useEffect } from 'react';
import { useTasks } from '@/context/TaskContext';
import { Bot, RefreshCw, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Persona = 'Chris Do' | 'Alex Hormozi' | 'Richard Bandler';

const PERSONAS: Record<Persona, { title: string; style: string; color: string; accent: string }> = {
  'Chris Do': {
    title: 'The Strategist',
    style: 'Socratic, design-focused, value-based pricing mindset.',
    color: 'text-red-500',
    accent: '#ef4444'
  },
  'Alex Hormozi': {
    title: 'Acquisition.com',
    style: 'Volume, leverage, offer creation, simple math.',
    color: 'text-amber-500',
    accent: '#f59e0b'
  },
  'Richard Bandler': {
    title: 'The Hypnotist',
    style: 'Pattern interrupt, NLP, changing submodalities.',
    color: 'text-blue-500',
    accent: '#3b82f6'
  }
};

export default function CoachSidebar() {
  const { tasks } = useTasks();
  const dailyTaskCount = tasks.filter(t => t.isDaily3 && !t.completed).length;
  const [currentPersona, setCurrentPersona] = useState<Persona>('Alex Hormozi');
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
    <div className="h-full flex flex-col bg-[var(--bg-panel)] border-l border-white/5 shadow-2xl">
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3 mb-4">
            <Bot size={24} className={PERSONAS[currentPersona].color} />
            <div>
              <h3 className="font-bold text-white text-sm">Strategic Advisor</h3>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">{PERSONAS[currentPersona].title}</p>
            </div>
        </div>
        
        {/* Persona Switcher */}
        <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
            {(Object.keys(PERSONAS) as Persona[]).map(p => (
                <button
                    key={p}
                    onClick={() => setCurrentPersona(p)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] uppercase font-black transition-all duration-300 ${currentPersona === p ? 'bg-white/10 text-white shadow-inner' : 'text-white/20 hover:text-white/40'}`}
                >
                    {p.split(' ')[1] || p} 
                </button>
            ))}
        </div>
        <p className="text-[10px] text-white/30 mt-3 italic leading-relaxed">{PERSONAS[currentPersona].style}</p>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div 
              key={advice}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white/5 border border-white/10 p-5 rounded-2xl relative backdrop-blur-sm"
          >
              <div className="absolute -left-2 top-6 w-3 h-3 bg-[#111111] transform rotate-45 border-l border-b border-white/10" />
              <p className="text-sm text-white/90 leading-relaxed font-medium">"{advice}"</p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-10">
            <h4 className="text-[10px] uppercase text-white/20 font-black tracking-widest mb-4">Strategic Tools</h4>
            <div className="space-y-2">
                <button className="w-full text-left p-3 rounded-xl hover:bg-white/5 text-xs text-white/50 hover:text-white transition-all border border-transparent hover:border-white/10 flex items-center gap-3">
                    <MessageSquare size={16} className="text-primary" />
                    <span>Scripting Assistant</span>
                </button>
                <button className="w-full text-left p-3 rounded-xl hover:bg-white/5 text-xs text-white/50 hover:text-white transition-all border border-transparent hover:border-white/10 flex items-center gap-3">
                    <RefreshCw size={16} className="text-accent" />
                    <span>Pattern Interrupt</span>
                </button>
            </div>
        </div>
      </div>
      
      <div className="p-6 border-t border-white/5 bg-black/20">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-white/20 uppercase font-bold">Daily 3 Status</span>
          <span className={dailyTaskCount === 3 ? 'text-accent' : 'text-primary'}>
            {dailyTaskCount}/3 ACTIVE
          </span>
        </div>
        <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
          <motion.div 
            className="h-full bg-primary" 
            initial={{ width: 0 }}
            animate={{ width: `${(dailyTaskCount / 3) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
