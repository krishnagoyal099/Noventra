import { useState, useEffect, useRef } from 'react';
import { JsonRpcProvider, Contract, formatEther, WebSocketProvider } from 'ethers';

// Custom provider to fix Somnia's broken eth_getLogs returning null for 'removed'
class SomniaProvider extends JsonRpcProvider {
  async send(method, params) {
    const result = await super.send(method, params);
    if (method === "eth_getLogs" && Array.isArray(result)) {
      return result.map(log => ({
        ...log,
        removed: log.removed ?? false,
      }));
    }
    return result;
  }
}

// Contract addresses — override via VITE_ALO_CORE_ADDRESS and VITE_MESSAGE_BUS_ADDRESS in .env.local
// Defaults point to the official Noventra Somnia Testnet deployment.
const ALO_CORE_ADDRESS = import.meta.env.VITE_ALO_CORE_ADDRESS ?? "0x2beE183Ce98cEBf13dfcaeba4c2965Cda8cDd13d";

// Minimal ABI for the dashboard
const ALO_CORE_ABI = [
  "function totalLiquidity() view returns (uint256)",
  "function getStrategyCount() view returns (uint256)",
];

const MESSAGE_BUS_ADDRESS = import.meta.env.VITE_MESSAGE_BUS_ADDRESS ?? "0x1e326DeC20fa7006C827e2DA6fa8dc56e7276d21";
const MESSAGE_BUS_ABI = [
  "event SignalSent(bytes32 indexed signalId, address indexed by, string signalType, bytes data, uint256 timestamp)"
];

const AGENT_REGISTRY_ADDRESS = import.meta.env.VITE_AGENT_REGISTRY_ADDRESS ?? "0x332CAd34b8291ACfAD87c8A6A41126cde3F906a6";
const AGENT_REGISTRY_ABI = [
  "function getAgentsByRole(uint8) view returns (address[])"
];

function formatLog(log, messageBus, index) {
  try {
    const args = log.args || messageBus.interface.parseLog(log).args;
    return {
      id: log.transactionHash ? `${log.transactionHash}-${index}` : `${Date.now()}-${index}`,
      strategyId: 0,
      agent: args.by,
      agentRole: args.signalType === "USER_INTENT" ? "USER" : "AGENT",
      action: args.signalType,
      timestamp: Number(args.timestamp),
      resultData: args.data
    };
  } catch {
    return null;
  }
}

export function useSomnia() {
  const [liquidity, setLiquidity] = useState("0");
  const [receipts, setReceipts] = useState([]);
  const [strategyCount, setStrategyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coordinatorAddress, setCoordinatorAddress] = useState(null);
  const [coordinatorBalance, setCoordinatorBalance] = useState("0");
  const seenIds = useRef(new Set());

  useEffect(() => {
    const provider = new SomniaProvider("https://dream-rpc.somnia.network");
    const contract = new Contract(ALO_CORE_ADDRESS, ALO_CORE_ABI, provider);
    const messageBus = new Contract(MESSAGE_BUS_ADDRESS, MESSAGE_BUS_ABI, provider);
    const registry = new Contract(AGENT_REGISTRY_ADDRESS, AGENT_REGISTRY_ABI, provider);

    const fetchCoordinator = async () => {
      try {
        const coords = await registry.getAgentsByRole(5); // 5 = COORDINATOR
        if (coords && coords.length > 0) {
          const addr = coords[0];
          setCoordinatorAddress(addr);
          const bal = await provider.getBalance(addr);
          setCoordinatorBalance(formatEther(bal));
        }
      } catch (err) {
        console.error("Failed to fetch coordinator", err);
      }
    };

    // ─── Fetch on-chain stats (liquidity, strategy count) ───
    const fetchStats = async () => {
      try {
        setError(null);
        const [liq, count] = await Promise.all([
          contract.totalLiquidity(),
          contract.getStrategyCount()
        ]);
        setLiquidity(formatEther(liq));
        setStrategyCount(Number(count));
      } catch (err) {
        console.error("Error fetching Somnia stats:", err);
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    };

    // ─── Load historical signals from the last 999 blocks ───
    const loadHistory = async () => {
      try {
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 999);
        const filter = messageBus.filters.SignalSent();
        const logs = await messageBus.queryFilter(filter, fromBlock, currentBlock);

        const formatted = logs
          .map((log, i) => formatLog(log, messageBus, i))
          .filter(Boolean)
          .filter(r => {
            if (seenIds.current.has(r.id)) return false;
            seenIds.current.add(r.id);
            return true;
          });

        if (formatted.length > 0) {
          setReceipts(prev => [...formatted.reverse(), ...prev]);
        }
      } catch (err) {
        console.error("History load error:", err);
      }
    };

    // ─── Real-time listener: new signals appear instantly ───
    let listenerIndex = 0;
    const onSignal = (signalId, by, signalType, data, timestamp, eventObj) => {
      const rawLog = { args: { by, signalType, data, timestamp }, transactionHash: eventObj?.log?.transactionHash };
      const receipt = formatLog(rawLog, messageBus, listenerIndex++);
      if (!receipt) return;
      if (seenIds.current.has(receipt.id)) return;
      seenIds.current.add(receipt.id);
      setReceipts(prev => [receipt, ...prev]);
    };

    messageBus.on("SignalSent", onSignal);

    fetchStats();
    fetchCoordinator();
    loadHistory();

    const statsInterval = setInterval(() => {
      fetchStats();
      fetchCoordinator();
    }, 5000);

    return () => {
      clearInterval(statsInterval);
      messageBus.removeAllListeners("SignalSent");
    };
  }, []);

  return { liquidity, receipts, strategyCount, loading, error, coordinatorAddress, coordinatorBalance };
}
