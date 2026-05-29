import { useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Lenis from 'lenis';
import { useSomnia } from './hooks/useSomnia';
import { Activity, Database, ShieldAlert, Cpu, Network } from 'lucide-react';

function SmoothScroll({ children }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  return <>{children}</>;
}

function Hero() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <motion.section 
      style={{ y, opacity }}
      className="flex-center" 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      style={{ minHeight: '80vh', flexDirection: 'column', textAlign: 'center' }}
    >
      <div className="glass" style={{ padding: '8px 16px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2rem' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-green)', boxShadow: '0 0 10px var(--accent-green)' }}></div>
        <span className="font-mono" style={{ fontSize: '14px', color: 'var(--accent-green)' }}>CONNECTED TO SOMNIA TESTNET</span>
      </div>
      
      <h1 style={{ fontSize: 'clamp(4rem, 8vw, 8rem)', letterSpacing: '-0.04em', lineHeight: 1 }}>
        AUTONOMOUS <br />
        <span className="text-gradient">LIQUIDITY ORCHESTRATOR</span>
      </h1>
      <p style={{ marginTop: '2rem', maxWidth: '600px', fontSize: '1.2rem', color: 'var(--text-muted)' }}>
        A fully autonomous, multi-agent swarm coordinating DeFi strategies with immutable on-chain audit trails.
      </p>
    </motion.section>
  );
}

function StatCard({ title, value, icon: Icon, delay }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card spotlight-wrapper"
    >
      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>{title}</h3>
        <Icon size={20} color="var(--accent-cyan)" />
      </div>
      <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
        {value}
      </div>
    </motion.div>
  );
}

function AuditTrail({ receipts, loading }) {
  const getRoleIcon = (role) => {
    switch(role) {
      case 'SCOUT': return <Activity size={16} color="var(--accent-purple)" />;
      case 'STRATEGY': return <Cpu size={16} color="var(--accent-cyan)" />;
      case 'RISK': return <ShieldAlert size={16} color="var(--accent-green)" />;
      default: return <Network size={16} />;
    }
  };

  return (
    <section className="container" style={{ paddingBottom: '100px' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Live Audit Trail</h2>
      
      {loading ? (
        <div className="font-mono text-muted">SYNCING WITH SOMNIA...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {receipts.length === 0 ? (
            <div className="glass-card font-mono text-muted">No receipts found on-chain.</div>
          ) : (
            receipts.map((receipt, i) => (
              <motion.div
                key={receipt.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass-card"
                style={{ display: 'grid', gridTemplateColumns: '150px 1fr auto', gap: '24px', alignItems: 'center' }}
              >
                <div className="font-mono text-muted" style={{ fontSize: '14px' }}>
                  {new Date(receipt.timestamp * 1000).toLocaleTimeString()}
                </div>
                
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    {getRoleIcon(receipt.agentRole)}
                    <span style={{ fontWeight: 600 }}>{receipt.action}</span>
                  </div>
                  <div className="font-mono text-muted" style={{ fontSize: '12px' }}>
                    Agent: {receipt.agent}
                  </div>
                </div>

                <a 
                  href={`https://testnet.somnia.exploreme.pro/address/${receipt.agent}`} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '14px', transition: 'background 0.2s' }}
                >
                  View Agent
                </a>
              </motion.div>
            ))
          )}
        </div>
      )}
    </section>
  );
}

function App() {
  const { liquidity, receipts, strategyCount, loading } = useSomnia();

  return (
    <SmoothScroll>
      <main style={{ minHeight: '100vh', padding: '24px' }}>
        <Hero />
        
        <section className="container" style={{ marginBottom: '100px' }}>
          <div className="grid-3">
            <StatCard title="System Liquidity" value={`${liquidity} STT`} icon={Database} delay={0.2} />
            <StatCard title="Active Strategies" value={strategyCount} icon={Cpu} delay={0.3} />
            <StatCard title="On-Chain Receipts" value={receipts.length} icon={Activity} delay={0.4} />
          </div>
        </section>

        <AuditTrail receipts={receipts} loading={loading} />
      </main>
    </SmoothScroll>
  );
}

export default App;
