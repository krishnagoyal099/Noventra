import { useState, useEffect } from 'react';
import { JsonRpcProvider, Contract, formatEther } from 'ethers';

// Hardcoded deployed ALOCore address on Somnia Testnet
const ALO_CORE_ADDRESS = "0x4ce55750E419ddF3535B9ef1C1CCb8960ec1146e";

// Minimal ABI for the dashboard
const ALO_CORE_ABI = [
  "function totalLiquidity() view returns (uint256)",
  "function getStrategyCount() view returns (uint256)",
  "function getAllReceipts() view returns (tuple(uint256 strategyId, address agent, string agentRole, string action, uint256 timestamp, bytes resultData)[])"
];

export function useSomnia() {
  const [liquidity, setLiquidity] = useState("0");
  const [receipts, setReceipts] = useState([]);
  const [strategyCount, setStrategyCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Connect to Somnia Testnet RPC
    const provider = new JsonRpcProvider("https://dream-rpc.somnia.network");
    const contract = new Contract(ALO_CORE_ADDRESS, ALO_CORE_ABI, provider);

    const fetchData = async () => {
      try {
        const [liq, count, rawReceipts] = await Promise.all([
          contract.totalLiquidity(),
          contract.getStrategyCount(),
          contract.getAllReceipts()
        ]);

        setLiquidity(formatEther(liq));
        setStrategyCount(Number(count));

        // Format receipts for the frontend
        const formattedReceipts = rawReceipts.map((r, index) => ({
          id: index,
          strategyId: Number(r.strategyId),
          agent: r.agent,
          agentRole: r.agentRole,
          action: r.action,
          timestamp: Number(r.timestamp),
          resultData: r.resultData
        })).reverse(); // Newest first

        setReceipts(formattedReceipts);
      } catch (err) {
        console.error("Error fetching Somnia data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Poll every 10 seconds for live updates
    const intervalId = setInterval(fetchData, 10000);
    return () => clearInterval(intervalId);
  }, []);

  return { liquidity, receipts, strategyCount, loading };
}
