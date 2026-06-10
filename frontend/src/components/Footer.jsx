import React from 'react';
import { ArrowUpRight, Network, Cpu, Bot } from 'lucide-react';

export default function Footer() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src="/logo.svg" alt="Noventra" style={{ height: '40px' }} />
          <span style={{ fontFamily: '"Britney", sans-serif', fontSize: '2.2rem', letterSpacing: '1px', background: 'linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 700 }}>NOVENTRA</span>
        </div>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '500px', lineHeight: '1.5' }}>
          The intent-driven autonomous economy. Replacing rigid smart contracts with a self-healing, multi-agent swarm.
        </p>


      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: 'auto', marginBottom: '24px' }}>
        <div>
          <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '2px' }} className="font-mono">PROTOCOL</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <a href="/whitepaper.pdf" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color='#fff'} onMouseOut={e => e.currentTarget.style.color='var(--text-secondary)'}>Whitepaper <ArrowUpRight size={16} opacity={0.5} /></a>
            <a href="https://github.com/krishnagoyal099/Noventra" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color='#fff'} onMouseOut={e => e.currentTarget.style.color='var(--text-secondary)'}><svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style={{ opacity: 0.8 }}><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg> <ArrowUpRight size={16} opacity={0.5} /></a>
          </div>
        </div>
        <div>
          <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '2px' }} className="font-mono">ECOSYSTEM</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <a href="https://testnet.somnia.network/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color='#fff'} onMouseOut={e => e.currentTarget.style.color='var(--text-secondary)'}><img src="/somnia-logo.png" style={{ width: '16px', height: '16px', objectFit: 'contain', opacity: 0.8 }} alt="Somnia" /> Somnia Network</a>
            <a href="https://groq.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color='#fff'} onMouseOut={e => e.currentTarget.style.color='var(--text-secondary)'}><img src="/groq-logo.png" style={{ width: '16px', height: '16px', objectFit: 'contain', opacity: 0.8 }} alt="Groq" /> Groq Inference</a>
            <a href="#" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color='#fff'} onMouseOut={e => e.currentTarget.style.color='var(--text-secondary)'}><Bot size={16} color="currentColor" style={{ opacity: 0.8 }} /> Agent Swarm Explorer</a>
          </div>
        </div>
      </div>

      <div style={{ 
        paddingTop: '20px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--accent-green)', boxShadow: '0 0 12px var(--accent-green)', animation: 'pulse 2s infinite' }}></span>
          <span style={{ fontFamily: '"Array", sans-serif', fontSize: '13px', color: 'var(--text-secondary)', letterSpacing: '1px' }}>SYSTEMS NOMINAL</span>
        </div>
        <div className="font-mono" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          © 2026 NOVENTRA. BUILT FOR AGENTATHON.
        </div>
      </div>

    </div>
  );
}
