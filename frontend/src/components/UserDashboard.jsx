import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Contract, AbiCoder, parseEther, JsonRpcProvider, formatEther } from 'ethers';
import { useWallet } from '../hooks/useWallet';
import { useSomnia } from '../hooks/useSomnia';
import { useUserHistory } from '../hooks/useUserHistory';
import { Wallet, ArrowRight, Zap, Coins, History } from 'lucide-react';
import LiveTerminal from './LiveTerminal';

// Deployed pool addresses on Somnia Testnet
const YIELD_POOL_ALPHA = "0xF9a098ddd8F8176c86e63606875a99668fD56090";
const YIELD_POOL_BETA  = "0xEcFe3093addA39C64E6B55804cdCDF657de2f6E9";

const YIELD_SOURCE_ABI = [
  "function deposit() external payable",
  "function deposits(address) view returns (uint256)",
  "function simulateYield(address) view returns (uint256)",
  "function currentAPY() view returns (uint256)",
  "function poolName() view returns (string)",
];

export default function UserDashboard() {
  const { account, balance, isCorrectChain, connect, isConnecting, getSigner } = useWallet();
  const { liquidity, receipts, error, coordinatorAddress, coordinatorBalance } = useSomnia();
  const history = useUserHistory(account);
  const [intentText, setIntentText] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedPool, setSelectedPool] = useState('alpha');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositTx, setDepositTx] = useState(null);
  const [activeIntents, setActiveIntents] = useState([]);
  const [portfolio, setPortfolio] = useState({ deposited: '0.000', yieldEarned: '0.000000' });

  useEffect(() => {
    if (!account) return;
    
    let isMounted = true;
    
    const fetchPortfolio = async () => {
      try {
        const provider = new JsonRpcProvider("https://dream-rpc.somnia.network");
        const alphaPool = new Contract(YIELD_POOL_ALPHA, YIELD_SOURCE_ABI, provider);
        const betaPool = new Contract(YIELD_POOL_BETA, YIELD_SOURCE_ABI, provider);

        const [alphaDep, betaDep, alphaYield, betaYield] = await Promise.all([
          alphaPool.deposits(account).catch(() => 0n),
          betaPool.deposits(account).catch(() => 0n),
          alphaPool.simulateYield(account).catch(() => 0n),
          betaPool.simulateYield(account).catch(() => 0n),
        ]);

        if (isMounted) {
          const totalDep = alphaDep + betaDep;
          const totalYield = alphaYield + betaYield;
          setPortfolio({
            deposited: Number(formatEther(totalDep)).toFixed(3),
            yieldEarned: Number(formatEther(totalYield)).toFixed(6)
          });
        }
      } catch (err) {
        console.error("Failed to fetch portfolio", err);
      }
    };

    fetchPortfolio();
    const interval = setInterval(fetchPortfolio, 3000); // Poll every 3s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [account]);

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount || isNaN(depositAmount) || Number(depositAmount) <= 0) return;
    setIsDepositing(true);
    setDepositTx(null);

    try {
      const signer = await getSigner();
      const poolAddress = selectedPool === 'alpha' ? YIELD_POOL_ALPHA : YIELD_POOL_BETA;
      const yieldPool = new Contract(poolAddress, YIELD_SOURCE_ABI, signer);

      const amountWei = parseEther(depositAmount);
      const tx = await yieldPool.deposit({ value: amountWei, gasLimit: 2000000 });
      setDepositTx({ hash: tx.hash, status: 'Pending...' });

      await tx.wait();
      setDepositTx({ hash: tx.hash, status: 'Confirmed! ✅' });
      history.recordDeposit(depositAmount, selectedPool, tx.hash);
      setDepositAmount('');
    } catch (err) {
      console.error(err);
      if (err.code !== 'ACTION_REJECTED') {
        alert(`Deposit failed: ${err.message?.slice(0, 100)}`);
      }
      setDepositTx(null);
    } finally {
      setIsDepositing(false);
    }
  };

  const [isFunding, setIsFunding] = useState(false);
  const [fundingTx, setFundingTx] = useState(null);

  const handleFundSwarm = async () => {
    if (!coordinatorAddress) return;
    setIsFunding(true);
    setFundingTx(null);
    try {
      const signer = await getSigner();
      const tx = await signer.sendTransaction({
        to: coordinatorAddress,
        value: parseEther("1.0"),
        gasLimit: 21000
      });
      setFundingTx({ hash: tx.hash, status: 'Pending...' });
      await tx.wait();
      setFundingTx({ hash: tx.hash, status: 'Confirmed! ✅' });
    } catch (err) {
      console.error(err);
      if (err.code !== 'ACTION_REJECTED') {
        alert(`Funding failed: ${err.message?.slice(0, 100)}`);
      }
      setFundingTx(null);
    } finally {
      setIsFunding(false);
    }
  };

  const handleSubmitIntent = async (e) => {
    e.preventDefault();
    if (!intentText.trim()) return;
    setIsSubmitting(true);
    
    try {
      const signer = await getSigner();
      const messageBus = new Contract("0x599312a994e130f2201D8De2cE2216d2A7848a98", [
        "function emitSignal(string _signalType, bytes _data) external returns (bytes32)"
      ], signer);

      const encodedData = AbiCoder.defaultAbiCoder().encode(["string"], [intentText]);
      // Hardcode gasLimit because eth_estimateGas fails on Somnia Testnet for this contract
      const tx = await messageBus.emitSignal("USER_INTENT", encodedData, { gasLimit: 10000000 });
      
      const newIntent = {
        id: Date.now(),
        text: intentText,
        status: 'Broadcasting...',
        time: new Date().toLocaleTimeString(),
        txHash: tx.hash
      };
      
      setActiveIntents(prev => [newIntent, ...prev]);
      history.recordIntent(intentText, tx.hash);
      setIntentText('');
      
      // Wait for it to be mined
      await tx.wait();
      
      setActiveIntents(prev => prev.map(intent => 
        intent.id === newIntent.id ? { ...intent, status: 'Mined! Agents processing...' } : intent
      ));
      
    } catch (err) {
      console.error("Intent Error:", err);
      // Alert the exact error string so the user can see what failed
      alert(`Transaction Failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>User Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{account || 'Not Connected'}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '4px' }}>AVAILABLE STT</p>
          <p style={{ fontSize: '1.8rem', fontWeight: 600, fontFamily: 'var(--font-display)' }}>{balance}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexGrow: 1, minHeight: 0 }}>
        
        {/* Left Column: Deposit & Gas Station */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Swarm Gas Station */}
          <div className="glass" style={{ padding: '24px', borderRadius: '24px', background: 'linear-gradient(145deg, rgba(255,200,52,0.05) 0%, rgba(255,100,52,0.05) 100%)', border: '1px solid rgba(255,200,52,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '8px', background: 'rgba(255,200,52,0.1)', borderRadius: '12px', color: '#ffcc00' }}>
                <Zap size={20} />
              </div>
              <h3 style={{ fontSize: '1.2rem', color: '#ffcc00' }}>Swarm Gas Station</h3>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Treasury Balance</span>
              <span style={{ fontSize: '1.2rem', fontFamily: 'monospace', color: Number(coordinatorBalance) < 1 ? '#ff4444' : '#00ffcc' }}>
                {Number(coordinatorBalance).toFixed(4)} <span style={{fontSize: '12px', color: 'var(--text-muted)'}}>STT</span>
              </span>
            </div>

            <button 
              type="button" 
              onClick={handleFundSwarm}
              disabled={isFunding || !account || !coordinatorAddress}
              style={{ 
                width: '100%', padding: '12px', borderRadius: '12px', 
                background: isFunding ? 'rgba(255,255,255,0.1)' : '#ffcc00', 
                color: isFunding ? '#fff' : '#000', 
                border: 'none', fontWeight: 600, cursor: (isFunding || !account) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {isFunding ? 'Funding Swarm...' : '⚡ Fund Swarm (1.0 STT)'}
            </button>
            {fundingTx && (
              <div style={{ marginTop: '12px', fontSize: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Status: <span style={{ color: '#00ffcc' }}>{fundingTx.status}</span>
              </div>
            )}
          </div>

          {/* Your Portfolio Card */}
          <div className="glass" style={{ padding: '24px', borderRadius: '24px', background: 'linear-gradient(145deg, rgba(52,243,255,0.05) 0%, rgba(189,45,255,0.05) 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-secondary)' }}>Your Portfolio</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Vault Deposits</span>
              <span style={{ fontSize: '1.2rem', fontFamily: 'monospace' }}>{portfolio.deposited} <span style={{fontSize: '12px', color: 'var(--text-muted)'}}>STT</span></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Yield Earned</span>
              <span style={{ fontSize: '1.2rem', fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>+{ (Number(portfolio.yieldEarned) + history.yieldEarned).toFixed(6) } <span style={{fontSize: '12px', color: 'var(--text-muted)'}}>STT</span></span>
            </div>
          </div>

          <div className="glass" style={{ padding: '24px', borderRadius: '24px', flexGrow: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ padding: '10px', background: 'rgba(52,243,255,0.1)', borderRadius: '12px', color: 'var(--accent-cyan)' }}>
                <Coins size={20} />
              </div>
              <h3 style={{ fontSize: '1.4rem' }}>Vault Deposit</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5 }}>
              Deposit Somnia Testnet Tokens (STT) into the Noventra Autonomous Vault to be managed by the AI agent swarm.
            </p>
            
            <form onSubmit={handleDeposit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Pool selector */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {['alpha', 'beta'].map(pool => (
                  <button
                    key={pool}
                    type="button"
                    onClick={() => setSelectedPool(pool)}
                    style={{
                      flex: 1, padding: '10px', border: '1px solid',
                      borderColor: selectedPool === pool ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)',
                      background: selectedPool === pool ? 'rgba(52,243,255,0.1)' : 'transparent',
                      color: selectedPool === pool ? 'var(--accent-cyan)' : 'var(--text-muted)',
                      borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontFamily: 'monospace',
                      fontWeight: selectedPool === pool ? 700 : 400,
                    }}
                  >
                    {pool === 'alpha' ? '🛡️ Alpha Pool (500 bps)' : '⚡ Beta Pool (800 bps)'}
                  </button>
                ))}
              </div>

              {/* Amount input */}
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  step="0.001"
                  min="0"
                  placeholder="0.000" 
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px 20px', borderRadius: '12px', color: '#fff', fontSize: '1.2rem', fontFamily: 'monospace', outline: 'none' }}
                />
                <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button type="button" onClick={() => setDepositAmount(balance)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: '10px', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>MAX</button>
                  <span style={{ color: 'var(--text-muted)' }}>STT</span>
                </div>
              </div>

              {/* Transaction status */}
              {depositTx && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  style={{ fontSize: '12px', padding: '10px 12px', background: 'rgba(52,243,255,0.05)', border: '1px solid rgba(52,243,255,0.2)', borderRadius: '10px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Status: </span>
                  <span style={{ color: 'var(--accent-cyan)' }}>{depositTx.status}</span>
                  <br />
                  <a href={`https://shannon-explorer.somnia.network/tx/${depositTx.hash}`} target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--accent-purple)', textDecoration: 'none', fontSize: '11px' }}>
                    View on Explorer ↗
                  </a>
                </motion.div>
              )}

              {!account ? (
                <button 
                  type="button" 
                  onClick={connect}
                  className="btn-primary" 
                  disabled={isConnecting} 
                  style={{ width: '100%', justifyContent: 'center', padding: '16px' }}
                >
                  <Wallet size={16} />
                  {isConnecting ? 'Connecting...' : 'Connect Wallet to Deposit'}
                </button>
              ) : (
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={isDepositing || !isCorrectChain || !depositAmount || Number(depositAmount) <= 0} 
                  style={{ width: '100%', justifyContent: 'center', padding: '16px', background: (depositAmount && !isDepositing) ? '#fff' : 'rgba(255,255,255,0.1)', color: (depositAmount && !isDepositing) ? '#000' : 'rgba(255,255,255,0.5)', border: 'none' }}
                >
                  {isDepositing ? '⏳ Confirming on Somnia...' : 'Deposit to Vault'}
                </button>
              )}
            </form>
          </div>

          {/* Live Flow of Agents */}
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>Agent Swarm Flow</h3>
            <div className="glass" style={{ borderRadius: '24px', overflow: 'hidden', flexGrow: 1, display: 'flex' }}>
              <LiveTerminal receipts={receipts} error={error} />
            </div>
          </div>
        </div>

        {/* Right Column: Intents */}
        <div style={{ flex: '1.5', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass" style={{ padding: '24px', borderRadius: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '10px', background: 'rgba(189,45,255,0.1)', borderRadius: '12px', color: 'var(--accent-purple)' }}>
                <Zap size={20} />
              </div>
              <h3 style={{ fontSize: '1.4rem' }}>Submit Natural Intent</h3>
            </div>
            
            <form onSubmit={handleSubmitIntent}>
              <textarea 
                value={intentText}
                onChange={e => setIntentText(e.target.value)}
                placeholder="e.g., Yield farm on Somnia alpha pool with 5% max drawdown, auto-compound daily."
                style={{ width: '100%', height: '100px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', borderRadius: '12px', color: '#fff', fontSize: '1rem', outline: 'none', resize: 'none', marginBottom: '16px', lineHeight: 1.5 }}
              ></textarea>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {!account ? (
                  <button 
                    type="button" 
                    onClick={connect}
                    className="btn-primary" 
                    disabled={isConnecting} 
                    style={{ padding: '12px 24px' }}
                  >
                    <Wallet size={16} />
                    <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={isSubmitting || !isCorrectChain || !intentText.trim()} 
                    style={{ padding: '12px 24px' }}
                  >
                    <span>Broadcast Intent</span>
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Active Intents List */}
          <div className="glass" style={{ padding: '24px', borderRadius: '24px', flexGrow: 1, overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--text-muted)' }}>Active Intents</h3>
            {activeIntents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '14px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                No active intents. Submit one above.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeIntents.map(intent => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={intent.id} 
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--accent-orange)' }}>
                        {intent.status === 'Broadcasting...' ? '⏳' : '⚙️'} {intent.status}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{intent.time}</span>
                    </div>
                    <p style={{ fontSize: '14px', lineHeight: 1.4, marginBottom: intent.txHash ? '8px' : '0' }}>"{intent.text}"</p>
                    {intent.txHash && (
                      <a 
                        href={`https://shannon-explorer.somnia.network/tx/${intent.txHash}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ fontSize: '11px', color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        View on Explorer ↗
                      </a>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full-width Transaction History */}
      {account && history.transactions.length > 0 && (
        <div className="glass" style={{ padding: '24px', borderRadius: '24px', marginTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
              <History size={20} />
            </div>
            <h3 style={{ fontSize: '1.4rem' }}>Transaction History</h3>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 8px', fontWeight: 500 }}>Time</th>
                  <th style={{ padding: '12px 8px', fontWeight: 500 }}>Type</th>
                  <th style={{ padding: '12px 8px', fontWeight: 500 }}>Details</th>
                  <th style={{ padding: '12px 8px', fontWeight: 500 }}>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {history.transactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 8px', color: 'rgba(255,255,255,0.7)' }}>
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '6px', 
                        fontSize: '11px', 
                        background: tx.type === 'DEPOSIT' ? 'rgba(52,243,255,0.1)' : 'rgba(189,45,255,0.1)',
                        color: tx.type === 'DEPOSIT' ? 'var(--accent-cyan)' : 'var(--accent-purple)'
                      }}>
                        {tx.type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {tx.type === 'DEPOSIT' ? `Deposited ${tx.amount} STT to ${tx.pool} pool` : `"${tx.text}"`}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      {tx.txHash ? (
                        <a 
                          href={`https://shannon-explorer.somnia.network/tx/${tx.txHash}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          Explorer ↗
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
