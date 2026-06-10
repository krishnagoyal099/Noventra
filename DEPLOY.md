# Noventra — Complete Deployment Guide

> Autonomous Liquidity Orchestrator — Live on Somnia Testnet (Chain ID: 50312)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   PUBLIC USER                           │
│              (Browser + MetaMask)                       │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────┐
│              FRONTEND (Vercel)                          │
│         React + Vite — serves whitepaper.pdf            │
└──────────────────────┬──────────────────────────────────┘
                       │ JSON-RPC + Events
┌──────────────────────▼──────────────────────────────────┐
│           SOMNIA TESTNET (Chain ID: 50312)              │
│   AgentRegistry · MessageBus · ALOCore · MockDEX        │
└──────────────────────┬──────────────────────────────────┘
                       │ eth_getLogs / sendTransaction
┌──────────────────────▼──────────────────────────────────┐
│         AGENT SWARM WORKER (Railway / Docker)           │
│   Scout · Strategy · Risk · Execution · Coordinator     │
│                       │                                 │
│              Groq LPU API (LLM)                         │
└─────────────────────────────────────────────────────────┘
```

---

## Prerequisites

| Requirement | Where to get it |
|---|---|
| Node.js 18+ | https://nodejs.org |
| Git | https://git-scm.com |
| MetaMask | https://metamask.io |
| Somnia Testnet added to MetaMask | RPC: `https://dream-rpc.somnia.network`, Chain ID: `50312` |
| Funded deployer wallet (STT) | https://faucet.somnia.network |
| 5 funded agent wallets (STT) | Same faucet — each needs at least 2 STT |
| Groq API key | https://console.groq.com (free) |
| Vercel account | https://vercel.com (free) |
| Railway account | https://railway.app (free) |

---

## Option A — Use the Existing Deployment (Fastest)

The contracts are **already deployed** on Somnia Testnet. The frontend is hardcoded to these addresses. You only need to run the agent swarm with your own Groq key.

**Skip to [Step 3 — Run the Agent Swarm](#step-3--run-the-agent-swarm-locally-or-on-railway).**

---

## Option B — Full Custom Deployment (Deploy Your Own Contracts)

### Step 1 — Clone & Install

```bash
git clone https://github.com/krishnagoyal099/Noventra.git
cd Noventra

# Install root dependencies (Hardhat, agents, scripts)
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### Step 2 — Configure Environment Variables

```bash
cp .env.example .env
```

Open `.env` and fill in every value:

```env
# Somnia Testnet RPC
SOMNIA_RPC_URL=https://dream-rpc.somnia.network

# Your main deployer wallet private key (funds and owns the contracts)
PRIVATE_KEY=0x_your_deployer_private_key_here
DEPLOYER_PRIVATE_KEY=0x_your_deployer_private_key_here

# 5 separate agent wallets — each needs 1-2 STT for gas
SCOUT_PRIVATE_KEY=0x_scout_wallet_private_key
RISK_PRIVATE_KEY=0x_risk_wallet_private_key
STRATEGY_PRIVATE_KEY=0x_strategy_wallet_private_key
EXECUTION_PRIVATE_KEY=0x_execution_wallet_private_key
COORDINATOR_PRIVATE_KEY=0x_coordinator_wallet_private_key

# Get your free key at https://console.groq.com
GROQ_API_KEY=gsk_your-groq-api-key-here
```

> **How to create 5 agent wallets:** In MetaMask, click your avatar → "Add account" five times. Export each private key via "Account details → Show private key". Fund each from the Somnia faucet.

### Step 3 — Deploy Contracts to Somnia

```bash
npm run deploy:somnia
```

This command will:
1. Deploy `AgentRegistry`, `MessageBus`, `ALOCore`, `MockDEX`, `YieldPoolAlpha`, `YieldPoolBeta`
2. Print all 6 contract addresses in the terminal
3. Automatically save them to `deployments/somnia.json`

**Copy the `ALOCore` and `MessageBus` addresses** and create `frontend/.env.local`:

```env
VITE_ALO_CORE_ADDRESS=0x_your_deployed_alocore_address
VITE_MESSAGE_BUS_ADDRESS=0x_your_deployed_messagebus_address
```

### Step 4 — Fund Agent Wallets

```bash
npx ts-node scripts/fund-agents.ts
```

It will ask: *"How much STT should each agent be funded to?"* — enter `2.0`. The script tops up all 5 wallets to 2 STT each (skipping any already funded).

---

## Step 3 — Run the Agent Swarm

### Option A — Run Locally (Development)

Open two terminals:

**Terminal 1 — Agent Swarm:**
```bash
npx ts-node scripts/listen-somnia.ts
```

You will see the agents boot, register, and start listening. Leave this running.

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

### Option B — Deploy to Railway (Production 24/7)

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select the `Noventra` repository
3. Railway auto-detects the `Procfile` and sets up the worker
4. Click **Variables** and add every env var from your `.env` file:

```
SOMNIA_RPC_URL         = https://dream-rpc.somnia.network
GROQ_API_KEY           = gsk_...
PRIVATE_KEY            = 0x...
DEPLOYER_PRIVATE_KEY   = 0x...
SCOUT_PRIVATE_KEY      = 0x...
RISK_PRIVATE_KEY       = 0x...
STRATEGY_PRIVATE_KEY   = 0x...
EXECUTION_PRIVATE_KEY  = 0x...
COORDINATOR_PRIVATE_KEY = 0x...
NODE_ENV               = production
```

5. Click **Deploy** — Railway will:
   - Auto-restart on crashes (exit code 1)
   - Show live agent logs in the Railway dashboard
   - Alert you if any agent wallet drops below 0.5 STT

### Option C — Deploy via Docker

```bash
# Build the image
docker build -t noventra-swarm .

# Run with your .env file
docker run --env-file .env --restart unless-stopped noventra-swarm

# Or use docker-compose (recommended)
docker compose up -d

# View live logs
docker compose logs -f agent-swarm
```

---

## Step 4 — Deploy Frontend to Vercel

### Option A — Vercel Dashboard (Recommended)

1. Push your repo to GitHub (already done if you cloned)
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the `Noventra` repository
4. Set **Root Directory** to `frontend`
5. Leave all other settings as defaults — `vercel.json` handles everything
6. Click **Deploy**

If you deployed your own contracts, add environment variables in Vercel:
- `VITE_ALO_CORE_ADDRESS` → your ALOCore address
- `VITE_MESSAGE_BUS_ADDRESS` → your MessageBus address

### Option B — Vercel CLI

```bash
cd frontend
npm install -g vercel
vercel --prod
```

---

## Step 5 — Verify Everything is Working

1. Open the deployed Vercel URL in your browser
2. Connect MetaMask — switch to Somnia Testnet (Chain ID: 50312)
3. The **Live Swarm Intelligence** terminal on the homepage should show real-time agent signals from the MessageBus
4. Submit a test intent (e.g. "yield farm my STT safely")
5. Watch the terminal — within 8-18 seconds you should see:
   - `OPPORTUNITY_FOUND`
   - `STRATEGY_PROPOSED`
   - `RISK_APPROVED` or `RISK_REJECTED`
   - `INTENT_SOLVED` (if approved)

6. Verify the transaction on the Somnia Explorer:
   **https://shannon-explorer.somnia.network**

---

## Deployed Contract Addresses (Somnia Testnet — Chain ID: 50312)

| Contract | Address |
|---|---|
| AgentRegistry | `0x2FEAb61eA02604B72D6A7A66D7fc2ca926E9f5E7` |
| MessageBus | `0x599312a994e130f2201D8De2cE2216d2A7848a98` |
| ALOCore | `0x6513684C358cD6d92Ad43225Ad9B8e3B81f01398` |
| MockDEX | `0x6AD7a0e21A997708657FeB019CbE10913AE4165a` |
| YieldPool Alpha | `0xF9a098ddd8F8176c86e63606875a99668fD56090` |
| YieldPool Beta | `0xEcFe3093addA39C64E6B55804cdCDF657de2f6E9` |

Explorer: https://shannon-explorer.somnia.network

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| Agent crashes immediately | Missing env var | Run `cat .env` and verify all 8 keys are set |
| `BAD_DATA` error in logs | Somnia RPC quirk | Already patched in `SomniaProvider` — check RPC URL |
| Gas estimation fails | Inflated estimate | Already capped at 12M gas in `SomniaProvider` |
| Frontend shows `0` TVL | Wrong contract address | Set `VITE_ALO_CORE_ADDRESS` in `frontend/.env.local` |
| No signals in terminal | Agent swarm not running | Start `npx ts-node scripts/listen-somnia.ts` |
| Agent wallet low balance | Gas spent on transactions | Top up from Somnia faucet — watch Railway logs for warnings |
| Vercel 404 on page refresh | SPA routing | Already fixed in `vercel.json` with rewrite rule |
| Docker build fails | Missing `package-lock.json` | Run `npm install` first to generate lockfile |

---

## Monitoring

- **Railway Logs:** Real-time agent output including wallet balances (checked every 10 min)
- **Somnia Explorer:** Every agent action is an on-chain `SignalSent` event — fully auditable
- **Frontend Terminal:** Live feed of `MessageBus` events visible to any visitor

---

*Built for the Somnia Agentathon 2025 — [github.com/krishnagoyal099/Noventra](https://github.com/krishnagoyal099/Noventra)*
