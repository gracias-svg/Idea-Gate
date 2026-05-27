'use client';

// src/components/TopBar.tsx
// Global navigation bar — idea input, run button, view nav.
// Nav: office | improve | desk (building removed)

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useData } from '@/lib/DataProvider';

const NAV_ROUTES = [
  { href: '/office',  label: 'office'  },
  { href: '/improve', label: 'improve' },
  { href: '/desk',    label: 'desk'    },
] as const;

const TopBar: React.FC = () => {
  const { state, refresh } = useData();
  const pathname = usePathname();
  const [idea,       setIdea]     = useState('');
  const [runStatus,  setRunStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [statusMsg,  setStatusMsg] = useState('');

  const handleRun = async () => {
    const trimmed = idea.trim();
    if (!trimmed || runStatus === 'running') return;

    setRunStatus('running');
    setStatusMsg('Starting lifecycle…');

    try {
      const res  = await fetch('/api/run', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ idea: trimmed }),
      });
      const data = await res.json();

      if (data.started) {
        setRunStatus('done');
        setStatusMsg('✓ Started — artifacts will appear shortly');
        setIdea('');
        // Staggered refresh — CLI needs time to generate files
        setTimeout(() => refresh(), 4000);
        setTimeout(() => refresh(), 8000);
        setTimeout(() => refresh(), 15000);
        setTimeout(() => { setRunStatus('idle'); setStatusMsg(''); }, 12000);
      } else {
        setRunStatus('error');
        setStatusMsg(`✗ ${data.error || 'Failed to start'}`);
        setTimeout(() => { setRunStatus('idle'); setStatusMsg(''); }, 5000);
      }
    } catch {
      setRunStatus('error');
      setStatusMsg('✗ Network error');
      setTimeout(() => { setRunStatus('idle'); setStatusMsg(''); }, 5000);
    }
  };

  const statusColor: Record<string, string> = {
    idle:    'transparent',
    running: '#f59e0b',
    done:    '#4ade80',
    error:   '#f87171',
  };

  return (
    <div style={{
      display:         'flex',
      alignItems:      'center',
      gap:             '12px',
      padding:         '0 16px',
      height:          '48px',
      backgroundColor: '#0a0a0a',
      borderBottom:    '1px solid #1e293b',
      flexShrink:      0,
      fontFamily:      "'JetBrains Mono','Fira Code',monospace",
    }}>

      {/* Stage indicator */}
      <div style={{ fontSize: '11px', color: '#475569', whiteSpace: 'nowrap' }}>
        Stage{' '}
        <span style={{ color: '#4ade80', fontWeight: 700 }}>{state.currentStage}</span>
        {' '}/{' '}14
      </div>

      <div style={{ width: '1px', height: '20px', backgroundColor: '#1e293b' }} />

      {/* Idea input */}
      <input
        type="text"
        value={idea}
        onChange={e => setIdea(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleRun()}
        placeholder="Enter idea to run lifecycle…"
        disabled={runStatus === 'running'}
        style={{
          flex:            1,
          minWidth:        '200px',
          maxWidth:        '480px',
          padding:         '5px 12px',
          backgroundColor: '#111',
          border:          '1px solid #1e293b',
          borderRadius:    '4px',
          color:           '#e2e8f0',
          fontFamily:      'inherit',
          fontSize:        '12px',
          outline:         'none',
          opacity:         runStatus === 'running' ? 0.5 : 1,
        }}
      />

      {/* Run button */}
      <button
        onClick={handleRun}
        disabled={!idea.trim() || runStatus === 'running'}
        style={{
          padding:         '5px 16px',
          backgroundColor: runStatus === 'running' ? '#1e293b' : '#4ade80',
          color:           runStatus === 'running' ? '#475569' : '#000',
          border:          'none',
          borderRadius:    '4px',
          fontFamily:      'inherit',
          fontSize:        '12px',
          fontWeight:      700,
          cursor:          (!idea.trim() || runStatus === 'running') ? 'not-allowed' : 'pointer',
          whiteSpace:      'nowrap',
          letterSpacing:   '0.05em',
        }}
      >
        {runStatus === 'running' ? '⟳ Running…' : '▶ Run'}
      </button>

      {/* Status */}
      {statusMsg && (
        <span style={{
          fontSize:    '11px',
          fontFamily:  'inherit',
          color:       statusColor[runStatus],
          whiteSpace:  'nowrap',
        }}>
          {statusMsg}
        </span>
      )}

      <div style={{ flex: 1 }} />

      {/* View navigation — office | improve | desk */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {NAV_ROUTES.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} style={{
              padding:         '4px 12px',
              fontFamily:      'inherit',
              fontSize:        '11px',
              borderRadius:    '4px',
              textDecoration:  'none',
              backgroundColor: active ? '#4ade80' : '#111',
              color:           active ? '#000'    : '#475569',
              border:          `1px solid ${active ? '#4ade80' : '#1e293b'}`,
              letterSpacing:   '0.05em',
            }}>
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default TopBar;
