import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider, formatEther } from 'ethers';

/** Somnia Testnet chain configuration */
const SOMNIA_CHAIN = {
  chainId: '0xC488', // 50312 in hex
  chainName: 'Somnia Testnet',
  nativeCurrency: { name: 'Somnia Token', symbol: 'STT', decimals: 18 },
  rpcUrls: ['https://dream-rpc.somnia.network'],
  blockExplorerUrls: ['https://shannon-explorer.somnia.network'],
};

const SOMNIA_CHAIN_ID_DEC = 50312;

/**
 * useWallet — MetaMask connection hook with Somnia Testnet auto-add/switch.
 *
 * @returns {{
 *   account: string|null,
 *   balance: string,
 *   chainId: number|null,
 *   isCorrectChain: boolean,
 *   isConnecting: boolean,
 *   error: string|null,
 *   connect: () => Promise<void>,
 *   disconnect: () => void,
 *   switchToSomnia: () => Promise<void>,
 * }}
 */
export function useWallet() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState('0');
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const isCorrectChain = chainId === SOMNIA_CHAIN_ID_DEC;

  /** Fetch native STT balance for connected account */
  const fetchBalance = useCallback(async (addr) => {
    if (!addr || !window.ethereum) return;
    try {
      const provider = new BrowserProvider(window.ethereum);
      const raw = await provider.getBalance(addr);
      setBalance(parseFloat(formatEther(raw)).toFixed(4));
    } catch {
      setBalance('0');
    }
  }, []);

  /** Prompt MetaMask to add/switch to Somnia Testnet */
  const switchToSomnia = useCallback(async () => {
    if (!window.ethereum) return;
    setError(null);
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SOMNIA_CHAIN.chainId }],
      });
    } catch (switchErr) {
      // 4902 = chain not added yet
      if (switchErr.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [SOMNIA_CHAIN],
          });
        } catch (addErr) {
          setError('Failed to add Somnia Testnet.');
        }
      } else {
        setError('Failed to switch to Somnia Testnet.');
      }
    }
  }, []);

  /** Connect wallet — requests accounts then ensures correct chain */
  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('No wallet detected. Please install MetaMask.');
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length === 0) throw new Error('No accounts returned.');

      const rawChainId = await window.ethereum.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(rawChainId, 16);

      setAccount(accounts[0]);
      setChainId(currentChainId);
      await fetchBalance(accounts[0]);

      // Auto-switch to Somnia if on wrong network
      if (currentChainId !== SOMNIA_CHAIN_ID_DEC) {
        await switchToSomnia();
      }
      return true;
    } catch (err) {
      if (err.code !== 4001) { // 4001 = user rejected
        setError(err.message || 'Connection failed.');
      }
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [fetchBalance, switchToSomnia]);

  /** Disconnect — clear local state (MetaMask has no programmatic disconnect) */
  const disconnect = useCallback(() => {
    setAccount(null);
    setBalance('0');
    setChainId(null);
    setError(null);
  }, []);

  /** Restore session on page load if already connected */
  useEffect(() => {
    if (!window.ethereum) return;

    const init = async () => {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const rawChainId = await window.ethereum.request({ method: 'eth_chainId' });
          setAccount(accounts[0]);
          setChainId(parseInt(rawChainId, 16));
          await fetchBalance(accounts[0]);
        }
      } catch {
        // Silent fail — user hasn't connected yet
      }
    };
    init();

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
        fetchBalance(accounts[0]);
      }
    };

    const handleChainChanged = (rawChainId) => {
      setChainId(parseInt(rawChainId, 16));
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [disconnect, fetchBalance]);
  const getSigner = async () => {
    if (!window.ethereum) throw new Error("MetaMask not found");
    const provider = new BrowserProvider(window.ethereum);
    return provider.getSigner();
  };

  return { account, balance, chainId, isCorrectChain, isConnecting, error, connect, disconnect, switchToSomnia, getSigner };
}
