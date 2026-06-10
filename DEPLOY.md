# Noventra — Deployment Guide

> **Autonomous Liquidity Orchestrator** — Live on Somnia Testnet

## Overview

This document explains how to deploy the full Noventra stack to the internet so public users can test it on Somnia Testnet.

The stack has two parts:
1. **Frontend** — React/Vite app → deploy to **Vercel**
2. **Agent Swarm** — TypeScript background process → deploy to **Railway**

---

## Prerequisites

- Node.js 18+
- A funded deployer wallet on Somnia Testnet
- 5 funded agent wallets on Somnia Testnet ([Somnia Faucet](https://testnet.somnia.network/))
- A free [Groq API key](https://console.groq.com) for LLM reasoning
- A [Vercel account](https://vercel.com) (free)
- A [Railway account](https://railway.app) (free)

---

## Step 1 — Clone & Configure

```bash
git clone https://github.com/krishnagoyal099/Noventra
cd alo-agentathon
cp .env.example .env
# Fill in all private keys and API key in .env
```

---

## Step 2 — Deploy Frontend to Vercel

```bash
cd frontend
npm install
npm run build    # Verify it builds cleanly first

# Option A: Vercel CLI
npx vercel --prod

# Option B: Vercel Dashboard
# 1. Push to GitHub
# 2. Import repo at vercel.com/new
# 3. Set Root Directory = "frontend"
# 4. Deploy
```

No environment variables needed for the frontend — all contract addresses are hardcoded for the Somnia Testnet deployment.

---

## Step 3 — Deploy Agent Swarm to Railway

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select this repository
3. Railway will auto-detect the `Procfile` and run the worker
4. Go to **Variables** and add:

```
SOMNIA_RPC_URL        = https://dream-rpc.somnia.network
GROQ_API_KEY          = gsk_...
DEPLOYER_PRIVATE_KEY  = 0x...
SCOUT_PRIVATE_KEY     = 0x...
RISK_PRIVATE_KEY      = 0x...
STRATEGY_PRIVATE_KEY  = 0x...
EXECUTION_PRIVATE_KEY = 0x...
COORDINATOR_PRIVATE_KEY = 0x...
```

5. Click **Deploy** — Railway will restart the agent swarm automatically on any crash.

---

## Step 4 — Top Up Agent Wallets

Agent wallets pay gas for every on-chain signal. With 5 STT per wallet, you can handle ~100–500 user intents before needing to refuel.

Check wallet addresses from the agent swarm startup log, then send STT from the [faucet](https://testnet.somnia.network/).

---

## Deployed Contract Addresses (Somnia Testnet — Chain ID 50312)

| Contract | Address |
|---|---|
| AgentRegistry | `0x2FEAb61eA02604B72D6A7A66D7fc2ca926E9f5E7` |
| MessageBus | `0x599312a994e130f2201D8De2cE2216d2A7848a98` |
| ALOCore | `0x6513684C358cD6d92Ad43225Ad9B8e3B81f01398` |
| MockDEX | `0x6AD7a0e21A997708657FeB019CbE10913AE4165a` |
| YieldPool Alpha (500 bps) | `0xF9a098ddd8F8176c86e63606875a99668fD56090` |
| YieldPool Beta (800 bps) | `0xEcFe3093addA39C64E6B55804cdCDF657de2f6E9` |

Explorer: [shannon-explorer.somnia.network](https://shannon-explorer.somnia.network)

---

## Architecture

```
User Browser (Vercel)
    ↕  MetaMask / Somnia Testnet RPC
Somnia Blockchain
    ↕  MessageBus events
Agent Swarm (Railway Worker)
    ↕  Groq LLM API
Strategy Decisions
```
