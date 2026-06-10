import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function LiveTerminal({ receipts = [], error = null }) {
  // Use the real on-chain receipts and show the 15 most recent ones in chronological order for the terminal view
  const logs = receipts.slice(0, 15).reverse().map(r => `[${r.agentRole}] ${r.action}`);

  return (
    <div className="terminal" style={{ height: '100%', flexGrow: 1, minHeight: '300px' }}>
      <div className="terminal-header">
        <div className="terminal-dot" style={{ background: '#ff5f56' }}></div>
        <div className="terminal-dot" style={{ background: '#ffbd2e' }}></div>
        <div className="terminal-dot" style={{ background: '#27c93f' }}></div>
        <div className="font-mono text-muted" style={{ marginLeft: '16px', fontSize: '12px' }}>noventra-daemon — tail -f agent-swarm.log</div>
      </div>
      <div className="terminal-body" id="terminal-body" style={{ overflowY: 'auto' }}>
        {error ? (
          <div className="font-mono" style={{ padding: '20px', color: '#ff5f56' }}>
            [ERROR] Failed to fetch agent logs from RPC:<br/>{error}
          </div>
        ) : logs.length === 0 ? (
          <div className="font-mono text-muted" style={{ padding: '20px', textAlign: 'center' }}>No agent logs yet. Waiting for on-chain receipts...</div>
        ) : (
          logs.map((log, i) => {
            let color = '#a0a0a0';
            if (log.includes('[SCOUT]')) color = 'var(--accent-purple)';
            if (log.includes('[STRATEGY]')) color = 'var(--accent-cyan)';
            if (log.includes('[RISK]')) color = 'var(--accent-green)';
            if (log.includes('[EXECUTION]')) color = 'var(--accent-orange)';
            if (log.includes('APPROVED') || log.includes('SUCCESS') || log.includes('SOLVED')) color = '#fff';
            if (log.includes('REJECTED') || log.includes('FAILED')) color = '#ff5f56';
            
            return (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={i} 
                className="log-line"
                style={{ color }}
              >
                <span style={{ opacity: 0.5 }}>{new Date().toISOString().split('T')[1].slice(0,-1)}</span> &nbsp;
                {log}
              </motion.div>
            );
          })
        )}
        <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1 }}>_</motion.div>
      </div>
    </div>
  );
}
