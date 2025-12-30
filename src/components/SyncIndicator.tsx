'use client';

import { useTasks } from '@/context/TaskContext';
import { Cloud, CloudOff, Loader2 } from 'lucide-react';

export default function SyncIndicator() {
  const { syncStatus, dbConnected } = useTasks();

  if (!dbConnected && syncStatus === 'idle') {
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-orange-400/70">
        <CloudOff size={12} />
        <span>Offline</span>
      </div>
    );
  }

  if (syncStatus === 'syncing') {
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-blue-400/70">
        <Loader2 size={12} className="animate-spin" />
        <span>Saving...</span>
      </div>
    );
  }

  if (syncStatus === 'success') {
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
        <Cloud size={12} />
        <span>Saved</span>
      </div>
    );
  }

  if (syncStatus === 'error') {
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-red-400">
        <CloudOff size={12} />
        <span>Sync Error</span>
      </div>
    );
  }

  // idle
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-white/20">
      <Cloud size={12} />
      <span>Cloud</span>
    </div>
  );
}
