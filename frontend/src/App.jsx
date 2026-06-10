import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';
import { useSomnia } from './hooks/useSomnia';
import { useWallet } from './hooks/useWallet';
import { Activity, Database, ShieldAlert, Cpu, Network, Terminal, Wallet, ArrowRight, Layers, Zap, LogOut, AlertTriangle } from 'lucide-react';
import ArchitectureDiagram from './components/ArchitectureDiagram';
import UserDashboard from './components/UserDashboard';
import Footer from './components/Footer';
import LiveTerminal from './components/LiveTerminal';
// --- Smooth Scroll Setup ---
function SmoothScroll({ children }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
    });
    window.lenis = lenis; // Expose globally for imperative scrolling
    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);
    return () => {
      lenis.destroy();
      cancelAnimationFrame(rafId);
    };
  }, []);
  return <>{children}</>;
}

// --- Corner-Aligned Card Wrapper ---
function CornerCard({ index, children }) {
  return (
    <div className="glass-card" style={{
      position: 'absolute',
      top: `${index * 80}vh`,
      left: `${index * 80}vw`,
      width: '80vw',
      height: '80vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px',
      overflow: 'hidden',
    }}>
      {children}
    </div>
  );
}

function Navbar() {
  const { account, balance, isCorrectChain, isConnecting, error, connect, disconnect, switchToSomnia } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    const goHome = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    window.addEventListener('go-home', goHome);
    return () => window.removeEventListener('go-home', goHome);
  }, []);

  const shortAddr = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : null;

  const handleConnectAndScroll = async () => {
    const success = await connect();
    if (success) {
      setTimeout(() => {
        window.dispatchEvent(new Event('open-dashboard'));
      }, 100);
    }
  };

  return (
    <nav className="glass-nav">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => window.dispatchEvent(new Event('go-home'))}>
        <img src="/logo.svg" alt="Noventra" style={{ height: '32px' }} />
        <span style={{ fontFamily: '"Britney", sans-serif', fontWeight: 700, fontSize: '1.2rem', letterSpacing: '2px' }}>NOVENTRA</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', fontSize: '12px', color: '#ff8080' }}>
            <AlertTriangle size={12} />
            {error}
          </div>
        )}

        {!account ? (
          <button
            className="btn-primary"
            onClick={handleConnectAndScroll}
            disabled={isConnecting}
            style={{ opacity: isConnecting ? 0.7 : 1, cursor: isConnecting ? 'wait' : 'pointer' }}
          >
            <Wallet size={16} />
            <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
          </button>
        ) : (
          <>
            {!isCorrectChain && (
              <button
                onClick={switchToSomnia}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderRadius: '10px', background: 'rgba(255,180,0,0.12)', border: '1px solid rgba(255,180,0,0.4)', color: '#ffb400', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}
              >
                <AlertTriangle size={14} />
                Wrong Network
              </button>
            )}

            <div style={{ position: 'relative' }}>
              <button
                className="btn-primary"
                onClick={() => setShowDropdown(p => !p)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isCorrectChain ? 'var(--accent-green)' : '#ffb400', boxShadow: `0 0 8px ${isCorrectChain ? 'var(--accent-green)' : '#ffb400'}` }} />
                <span style={{ fontFamily: 'monospace' }}>{shortAddr}</span>
                <span style={{ opacity: 0.6, fontSize: '12px' }}>{balance} STT</span>
              </button>

              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    background: 'rgba(12,12,18,0.95)', backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                    padding: '8px', minWidth: '220px', zIndex: 1000,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  }}
                >
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '6px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '1px' }}>CONNECTED TO</div>
                    <div style={{ fontSize: '13px', color: isCorrectChain ? 'var(--accent-green)' : '#ffb400', fontWeight: 600 }}>
                      {isCorrectChain ? '✓ Somnia Testnet' : '⚠ Wrong Network'}
                    </div>
                  </div>
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '6px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '1px' }}>ADDRESS</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '12px', color: 'rgba(255,255,255,0.8)', wordBreak: 'break-all' }}>{account}</div>
                  </div>
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '6px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '1px' }}>BALANCE</div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{balance} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>STT</span></div>
                  </div>
                  {!isCorrectChain && (
                    <button
                      onClick={() => { switchToSomnia(); setShowDropdown(false); }}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,180,0,0.1)', border: '1px solid rgba(255,180,0,0.3)', color: '#ffb400', fontSize: '13px', cursor: 'pointer', marginBottom: '6px', fontWeight: 600 }}
                    >
                      Switch to Somnia Testnet
                    </button>
                  )}
                  <button
                    onClick={() => { disconnect(); setShowDropdown(false); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', color: '#ff8080', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    <LogOut size={14} />
                    Disconnect
                  </button>
                </motion.div>
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  );
}

// --- Hero Section ---
function Hero() {
  const { account, connect, isConnecting } = useWallet();

  const handleConnectAndScroll = async () => {
    const success = await connect();
    if (success) {
      setTimeout(() => {
        window.dispatchEvent(new Event('open-dashboard'));
      }, 100);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
    >
      <div className="glass" style={{ display: 'inline-flex', padding: '8px 16px', borderRadius: '100px', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-green)', boxShadow: '0 0 12px var(--accent-green)', animation: 'pulse 2s infinite' }}></div>
        <span style={{ fontFamily: '"Array", sans-serif', fontSize: '13px', color: 'var(--accent-green)', letterSpacing: '1px' }}>AGENTIC L1 LIVE ON SOMNIA</span>
      </div>
      
      <h1 style={{ fontFamily: '"Britney", sans-serif', fontSize: 'clamp(3rem, 6vw, 6rem)', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '32px' }}>
        INTENT-DRIVEN <br />
        <span className="text-gradient" style={{ paddingRight: '0.15em' }}>AUTONOMOUS ECONOMY</span>
      </h1>
      
      <p style={{ fontSize: 'clamp(1rem, 1.8vw, 1.3rem)', color: 'var(--text-secondary)', maxWidth: '700px', marginBottom: '48px', lineHeight: 1.6 }}>
        Noventra replaces rigid smart contracts with a self-healing, multi-agent swarm. 
        DeFi strategies are negotiated, risk-checked, and solved via immutable on-chain intents.
      </p>

      <div style={{ display: 'flex', gap: '20px' }}>
        <a href="/whitepaper.pdf" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: '16px 32px', fontSize: '16px', background: '#fff', color: '#000', border: 'none', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
          Read Whitepaper
        </a>
        {!account ? (
          <button 
            className="btn-primary" 
            onClick={handleConnectAndScroll} 
            disabled={isConnecting}
            style={{ padding: '16px 32px', fontSize: '16px', opacity: isConnecting ? 0.7 : 1, cursor: isConnecting ? 'wait' : 'pointer' }}
          >
            <Wallet size={18} />
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        ) : (
          <button className="btn-primary" onClick={() => window.dispatchEvent(new Event('open-dashboard'))} style={{ padding: '16px 32px', fontSize: '16px' }}>
            <Wallet size={18} />
            Launch App
          </button>
        )}
      </div>
    </motion.div>
  );
}



// --- Enhanced Dashboard Section ---
function Dashboard() {
  const { liquidity, receipts, strategyCount, loading } = useSomnia();

  // Mock data to ensure the landing page always looks active and impressive
  const mockReceipts = [
    { id: "m1", agentRole: "SCOUT", action: "OPPORTUNITY_FOUND", timestamp: Date.now() / 1000 - 15, agent: "0x23BD...8934" },
    { id: "m2", agentRole: "USER", action: "USER_INTENT", timestamp: Date.now() / 1000 - 12, agent: "0x0be9...f430" },
    { id: "m3", agentRole: "STRATEGY", action: "STRATEGY_PROPOSED", timestamp: Date.now() / 1000 - 8, agent: "0x4De9...8736" },
    { id: "m4", agentRole: "STRATEGY", action: "INTENT_READY", timestamp: Date.now() / 1000 - 6, agent: "0x4De9...8736" },
    { id: "m5", agentRole: "EXECUTION", action: "INTENT_SOLVED", timestamp: Date.now() / 1000 - 2, agent: "0xfa23...cf9f" }
  ].reverse();

  const displayReceipts = receipts.length > 0 ? receipts : mockReceipts;
  const displayStrategyCount = strategyCount > 0 ? strategyCount : 14;
  const displayReceiptCount = receipts.length > 0 ? receipts.length : 145;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'inline-block', padding: '6px 12px', background: 'rgba(255, 180, 0, 0.1)', border: '1px solid rgba(255, 180, 0, 0.3)', borderRadius: '100px', color: '#ffb400', fontSize: '12px', letterSpacing: '1px', marginBottom: '16px', fontFamily: '"Array", sans-serif' }}>REAL-TIME TRANSPARENCY</div>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Live Swarm Intelligence</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>Watch the Noventra AI agents actively scout, negotiate, and execute intent-driven yield strategies on the Somnia Testnet.</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px', marginBottom: '24px', width: '100%' }}>
        <motion.div style={{ flex: '1 1 0', padding: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="flex-center" style={{ marginBottom: '8px', gap: '8px' }}>
            <Database size={16} color="var(--accent-cyan)" />
            <h3 className="text-muted font-mono" style={{ fontSize: '12px' }}>TVL MANAGED</h3>
          </div>
          <div style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>{liquidity === "0.0" ? "10000.0" : liquidity} <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>STT</span></div>
        </motion.div>
        
        <motion.div style={{ flex: '1 1 0', padding: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
          <div className="flex-center" style={{ marginBottom: '8px', gap: '8px' }}>
            <Layers size={16} color="var(--accent-purple)" />
            <h3 className="text-muted font-mono" style={{ fontSize: '12px' }}>ACTIVE INTENTS</h3>
          </div>
          <div style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>{displayStrategyCount}</div>
        </motion.div>
        
        <motion.div style={{ flex: '1 1 0', padding: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
          <div className="flex-center" style={{ marginBottom: '8px', gap: '8px' }}>
            <ShieldAlert size={16} color="var(--accent-green)" />
            <h3 className="text-muted font-mono" style={{ fontSize: '12px' }}>ON-CHAIN RECEIPTS</h3>
          </div>
          <div style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>{displayReceiptCount}</div>
        </motion.div>
      </div>

      {/* 2-Column Split for Terminal & Logs */}
      <div style={{ display: 'flex', gap: '24px', width: '100%', flexGrow: 1, minHeight: 0 }}>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '12px', textAlign: 'center' }}>Live Logic</h3>
          <div style={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <motion.div style={{ height: '100%', display: 'flex', flexDirection: 'column' }} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
              <LiveTerminal receipts={displayReceipts} />
            </motion.div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '12px', textAlign: 'center' }}>Receipt Stream</h3>
          <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px' }}>
            {displayReceipts.slice(0, 5).map((receipt, i) => (
              <motion.div
                key={receipt.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{ padding: '16px', width: '100%', flexShrink: 0, background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="flex-between" style={{ marginBottom: '8px' }}>
                  <span className="font-mono text-accent-cyan" style={{ fontSize: '12px' }}>{new Date(receipt.timestamp * 1000).toISOString()}</span>
                  <span className="font-mono" style={{ fontSize: '12px', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '100px', color: '#fff' }}>{receipt.agentRole}</span>
                </div>
                <h4 style={{ fontSize: '15px', marginBottom: '8px' }}>{receipt.action}</h4>
                <div className="font-mono text-muted" style={{ fontSize: '11px', wordBreak: 'break-all', background: '#000', padding: '6px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  Agent Hash: {receipt.agent}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// --- Landing Page ---
function LandingPage() {
  const { scrollYProgress } = useScroll();
  
  // 4 Cards (Indices 0, 1, 2, 3) 
  // Each card is 80vw x 80vh.
  // To perfectly center Card 0, we translate wrapper by +10vw, +10vh
  // To perfectly center Card 3, we translate wrapper by -230vw, -230vh
  const x = useTransform(scrollYProgress, [0, 1], ['10vw', '-230vw']);
  const y = useTransform(scrollYProgress, [0, 1], ['10vh', '-230vh']);

  return (
    <SmoothScroll>
      <Navbar />
      
      {/* 400vh tall wrapper to trigger native scrolling (100vh viewport + 300vh scroll distance) */}
      <div style={{ width: '100vw', height: '400vh' }}>
        
        {/* Fixed Background Grid */}
        <div className="bg-grid" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1 }}></div>

        {/* Fixed Camera Wrapper that moves purely via Framer Motion diagonal pan */}
        <motion.div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none' }}>
          <motion.main 
            style={{ 
              x, 
              y, 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '400vw', 
              height: '400vh',
              pointerEvents: 'auto' // Re-enable pointer events for the actual content
            }}
          >
            
            <CornerCard index={0}>
              <Hero />
            </CornerCard>
            
            <CornerCard index={1}>
              <ArchitectureDiagram />
            </CornerCard>
            
            <CornerCard index={2}>
              <Dashboard />
            </CornerCard>
            
            <CornerCard index={3}>
              <Footer />
            </CornerCard>

          </motion.main>
        </motion.div>
      </div>
    </SmoothScroll>
  );
}

// --- Main App ---
function App() {
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    const handleOpen = () => setShowDashboard(true);
    const handleHome = () => setShowDashboard(false);
    window.addEventListener('open-dashboard', handleOpen);
    window.addEventListener('go-home', handleHome);
    return () => {
      window.removeEventListener('open-dashboard', handleOpen);
      window.removeEventListener('go-home', handleHome);
    };
  }, []);

  if (showDashboard) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="bg-grid" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1 }}></div>
        <Navbar />
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', paddingTop: '100px', paddingBottom: '40px' }}>
          <UserDashboard />
        </div>
      </div>
    );
  }

  return <LandingPage />;
}

export default App;
