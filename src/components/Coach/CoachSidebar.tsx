'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Bot, RefreshCw, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

type Persona = 'Chris Do' | 'Alex Hormozi' | 'Richard Bandler';

const PERSONAS: Record<Persona, { title: string; style: string; color: string }> = {
  'Chris Do': {
    title: 'The Strategist',
    style: 'Socratic, design-focused, value-based pricing mindset.',
    color: 'text-red-500' // The Futur red?
  },
  'Alex Hormozi': {
    title: 'The Gym Launch',
    style: 'Volume, leverage, offer creation, simple math.',
    color: 'text-accent-gold'
  },
  'Richard Bandler': {
    title: 'The Hypnotist',
    style: 'Pattern interrupt, NLP, changing submodalities.',
    color: 'text-blue-500'
  }
};

export default function CoachSidebar() {
  const { dailyTaskIds } = useStore();
  const [currentPersona, setCurrentPersona] = useState<Persona>('Alex Hormozi');
  const [advice, setAdvice] = useState<string>("Ready to work?");

  // Simulate "coaching" based on state changes
  useEffect(() => {
    // Determine context
    const count = dailyTaskIds.length;
    let msg = "";

    if (currentPersona === 'Alex Hormozi') {
        if (count === 0) msg = "You have zero leverage right now. Fill the slots. Volume implies success.";
        else if (count < 3) msg = "Why leave capacity on the table? Maximize your daily output.";
        else msg = "Good. Now do the boring work. Success is doing what you said you would do.";
    } else if (currentPersona === 'Chris Do') {
        if (count === 0) msg = "What is the one thing that moves the needle? Don't just be busy.";
        else msg = "Is this work priced correctly? Are you solving a big enough problem?";
    } else {
        // Bandler
        msg = "Are you sure that's what you want to do? Or is that just a picture in your head?";
    }
    
    setAdvice(msg);
  }, [dailyTaskIds.length, currentPersona]);

  return (
    <div className="h-full flex flex-col bg-[#0f0f0f] border-l border-white/5">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2 mb-2">
            <Bot size={20} className={PERSONAS[currentPersona].color} />
            <h3 className="font-bold text-white text-sm">Persona Coach</h3>
        </div>
        
        {/* Persona Switcher */}
        <div className="flex gap-1 bg-black/20 p-1 rounded-lg">
            {(Object.keys(PERSONAS) as Persona[]).map(p => (
                <button
                    key={p}
                    onClick={() => setCurrentPersona(p)}
                    className={`flex-1 py-1 rounded text-[10px] uppercase font-bold transition-all ${currentPersona === p ? 'bg-white/10 text-white' : 'text-white/20 hover:text-white/40'}`}
                >
                    {p.split(' ')[1]} 
                </button>
            ))}
        </div>
        <p className="text-[10px] text-white/30 mt-2 italic">{PERSONAS[currentPersona].style}</p>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <motion.div 
            key={advice}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1a1a1a] border border-white/5 p-4 rounded-xl relative"
        >
            <div className="absolute -left-2 top-4 w-2 h-2 bg-[#1a1a1a] transform rotate-45 border-l border-b border-white/5" />
            <p className="text-sm text-white/80 leading-relaxed font-medium">"{advice}"</p>
        </motion.div>

        {/* Placeholder for future chat/interactions */}
        <div className="mt-8">
            <h4 className="text-xs uppercase text-white/20 font-bold mb-4">Quick Strategies</h4>
            <div className="space-y-2">
                <button className="w-full text-left p-2 rounded hover:bg-white/5 text-xs text-white/50 hover:text-white transition-colors flex items-center gap-2">
                    <MessageSquare size={14} />
                    <span>Generate "Magic Words"</span>
                </button>
                <button className="w-full text-left p-2 rounded hover:bg-white/5 text-xs text-white/50 hover:text-white transition-colors flex items-center gap-2">
                    <RefreshCw size={14} />
                    <span>Reframing Exercise</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
