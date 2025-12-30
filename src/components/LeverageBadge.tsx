'use client';

import React from 'react';

interface Props {
  score: number;
}

export default function LeverageBadge({ score }: Props) {
  // Score range roughly 0 to 100 in concept, but calculation might go higher.
  // Color Logic:
  // < 1.0: Low (Gray)
  // 1.0 - 5.0: Medium (Blue)
  // 5.0 - 20.0: High (Gold)
  // > 20.0: Ultra (Emerald)
  
  let color = '#94A3B8'; // Slate 400
  let label = 'Low Leverage';
  
  if (score >= 1 && score < 5) {
    color = '#60A5FA'; // Blue 400
    label = 'Decent';
  } else if (score >= 5 && score < 20) {
    color = '#F59E0B'; // Amber 500
    label = 'High Value';
  } else if (score >= 20) {
    color = '#10B981'; // Emerald 500
    label = 'Ultra High';
  }

  // Visual Bar Width (capped at 100%)
  // Let's assume max reasonable score is 25 for the bar visual
  const width = Math.min((score / 25) * 100, 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '120px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color }}>
        <span>{label}</span>
        <span>{score.toFixed(1)}</span>
      </div>
      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ 
          width: `${width}%`, 
          height: '100%', 
          background: color,
          boxShadow: `0 0 10px ${color}`,
          transition: 'width 0.5s ease-out'
        }} />
      </div>
    </div>
  );
}
