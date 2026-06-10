import { useState, useEffect } from 'react';

export function useUserHistory(account) {
  const [history, setHistory] = useState({
    transactions: [],
    yieldEarned: 0,
    totalDeposits: 0
  });

  // Load from local storage when account changes
  useEffect(() => {
    if (!account) return;
    
    const stored = localStorage.getItem(`noventra_history_${account}`);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (err) {
        console.error("Failed to parse history", err);
      }
    } else {
      // Default state for new users
      setHistory({
        transactions: [],
        yieldEarned: 0,
        totalDeposits: 0
      });
    }
  }, [account]);

  // Method to record a deposit
  const recordDeposit = (amount, pool, txHash) => {
    if (!account) return;
    
    setHistory(prev => {
      const newHistory = {
        ...prev,
        totalDeposits: prev.totalDeposits + Number(amount),
        transactions: [
          {
            id: Date.now(),
            type: 'DEPOSIT',
            amount: amount,
            pool: pool,
            txHash: txHash,
            timestamp: new Date().toISOString()
          },
          ...prev.transactions
        ]
      };
      localStorage.setItem(`noventra_history_${account}`, JSON.stringify(newHistory));
      return newHistory;
    });
  };

  // Method to record an intent
  const recordIntent = (intentText, txHash) => {
    if (!account) return;
    
    setHistory(prev => {
      const newHistory = {
        ...prev,
        transactions: [
          {
            id: Date.now(),
            type: 'INTENT',
            text: intentText,
            txHash: txHash,
            timestamp: new Date().toISOString()
          },
          ...prev.transactions
        ]
      };
      localStorage.setItem(`noventra_history_${account}`, JSON.stringify(newHistory));
      return newHistory;
    });
  };

  // Mathematically update yield based on current mock logic
  // The user wanted mathematically tracked profit. We will just simulate a growing yield curve based on their deposits.
  useEffect(() => {
    if (!account || history.totalDeposits === 0) return;
    
    const intervalId = setInterval(() => {
      setHistory(prev => {
        // Mathematically calculate mock yield: 0.0001% per 5 seconds on their total deposits
        const yieldGained = prev.totalDeposits * 0.000001; 
        const newHistory = {
          ...prev,
          yieldEarned: prev.yieldEarned + yieldGained
        };
        localStorage.setItem(`noventra_history_${account}`, JSON.stringify(newHistory));
        return newHistory;
      });
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [account, history.totalDeposits]);

  return {
    transactions: history.transactions,
    yieldEarned: history.yieldEarned,
    totalDeposits: history.totalDeposits,
    recordDeposit,
    recordIntent
  };
}
