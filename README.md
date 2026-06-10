<div align="center">
  <br />
  <img src="logo-white.svg" alt="Noventra Logo" width="250" />
  <br />
  <br />
  <p><strong>The Intent-Driven Autonomous Economy on Somnia Agentic L1</strong></p>
</div>

---

## Overview

**Noventra** replaces rigid smart contracts with a self-healing, multi-agent AI swarm. Users simply submit natural language **intents** (e.g., *"Yield farm my STT safely"*), and a decentralized network of specialized AI agents negotiates, strategizes, and executes the optimal path directly on the Somnia Testnet.

Built for the **Somnia Agentathon**, Noventra bridges the gap between High-Frequency Trading (HFT) concepts and ultra-fast LLM reasoning.

## Swarm Architecture

Noventra operates using a decentralized, event-driven `MessageBus` smart contract deployed on Somnia. Agents do not use rigid REST APIs; they listen to the blockchain and react autonomously.

1. **User Intent:** Submitted via the React Frontend dashboard.
2. **Strategy Agent (The Brain):** Powered by **Groq**. It listens for user intents, analyzes current market data, and proposes an optimal yield strategy via an on-chain `STRATEGY_PROPOSED` signal.
3. **Execution Agent (The Solver):** A specialized TypeScript daemon. It listens for approved strategies, handles the complex cryptographic signing, and executes the raw transaction on the Somnia EVM, leaving an immutable `INTENT_SOLVED` receipt.

## Tech Stack

<p align="left">
  <img src="https://img.shields.io/badge/Somnia_Testnet-000000?style=for-the-badge&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAcCAYAAAByDd%2BUAAAEkklEQVR4AZxWS0hjZxQ%2BcSEqKkIHFRnB924kIDgFH92ICONQRAPdaKO1C0FwMRCV2k27UIOzUARBrFpXhSgy4IiIlOKzdSHqLARfiCn4gKAoRHHR9PtObjI3Ta5jR%2F7v%2F89%2FznfOd%2B%2F%2FuDFOPvEXCASSgJfAT8AfwOk%2Fxh9tgD7GyEn6RDmxFEShZ8C3KPCngR8xfgVk24w%2F2gB9jCmPOcAX8MdsMQWR8BLscWASeAE8tZHLnF%2BMGlF5UYIgfgOWB3gNfG77GokeoxbMjy1C0CC4j46OsmdnZ2Vqakqxvb39McPCWltbUy5zmHt%2Bfp4NqtuoCTPYwoIIcBndSMxua2sTwul0ihNYXFwMsi165Abm5uaUS35nZ6f09PQIHjQkytqarYJIeIbZD9fX19kTExOytLSEqQgTieLiYp0%2F1pWWlob5h4eHMj4%2BLsaDUrQbGnqQVBCFXgGvT05O5PT0FKYInk56e3sVNTU16rPqeGjr6uqUy5z5%2BXml7u%2FvC5aWNve0lkYclHl33nBiRmpqqnn6v%2ByUlJRY%2FDfU4hvyKBOxSBE%2BLLm%2BOfZZQuAboFAgghh7Qo0XFORyxqaYvCw8OjoqXN6KigoJoaOjQ9bX121PFH1FwUpTXbm%2FvzdP1WaxjY0N6erqktraWllZWVHMzMwIl%2B%2F29la4j0p%2BvCujYB4L%2Bv1%2B2d3dldXV1agUFmNRBjjm5%2BdLWVmZ8KAMDAxIZWUlQ2Ewzsny8rJuAWtTA75CHprnOzs7tuTkZHG5XPCJTE5OSmJiYnhfSObVKCgoEI%2FHI3a7XUW6u7vF5%2FNJUhLPnaZql5GREejr6xNeDyfucV5enhwfH3PZn%2FMNlZSenq5jrI5vSJHNzU3hw1Cce9rf3y%2BFhYXidruFb2HOvbq6Ck%2FNJz4Oxf5mMRYYGRlRktPplLu7O5tOjI4F4%2BPjpampSS807ynFGR4bGxPeOdrExcWFjQ%2FDFeE%2BM8Zlphbf8JgkIjc3V8rLy2lGgGLT09MyPDys1wHfWjk7OxMWYdHMzMwIPuN0cG%2FJoW3ggILLxkSHhIQEHc3dw8ODfjF4Snkdmpub9VtbX18vNzc30traKkVFReYUK3uNgu%2BtoiF%2FWlqatLe3y9bWlnCJeDWqqqp07xYWFqShoSHq4IRy%2FzO%2Bp%2BAHOAkM1o0nkXvNq0BxorGxMUAfY9aZ4Qg1PvDQ%2BOF6C0Q0LlWEwzShAIFDYDO5w%2Bbl5WXYNhlvwffzDembQ%2FcuJydHSkpKYIpkZWXp3nB%2F%2BIOqTouO95Q%2FvOQS3FtSua%2FGgZrFnBrBf6Kg7IOjF3vl5f44HA7h6eNvGnFwcIDw421vb09%2FA8lnbktLixjCXmT2GxpBQTj4LfwLowufLO%2Fg4KAMDQ0J7xlRXV2NkHVDMRsflFyCufzk4UpQzIU4a2uB0JLqBIHfYLiwDF7%2BKvCSE3a7He7HGx5UPwrkM5erhQyKsSbMYIsQpMsQdcB%2BB3xu4545jFoRNaIEGQWRS%2FAdbCfA44zhSY1c5nxv1IhKiilIFhJ8wK%2BwvzTwM8bfAS9PJUEboI8x5TEH4CFEKLr9CwAA%2F%2F%2BC38ZxAAAABklEQVQDAICVI%2B3A8U7qAAAAAElFTkSuQmCC" alt="Somnia Testnet" />
  <img src="https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white" alt="Solidity" />
  <img src="https://img.shields.io/badge/Hardhat-FFF100?style=for-the-badge&logoColor=black" alt="Hardhat" />
  <img src="https://img.shields.io/badge/Groq_SDK-F55036?style=for-the-badge&logoColor=white" alt="Groq SDK" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
</p>

---

## Local Setup & Installation

### 1. Clone & Install
```bash
git clone https://github.com/krishnagoyal099/Noventra.git
cd Noventra
npm install
cd frontend && npm install
cd ..
```

### 2. Environment Variables
Copy the template and fill in your keys:
```bash
cp .env.example .env
```
*You will need a [Groq API key](https://console.groq.com/) and a Somnia Testnet private key.*

### 3. Deploy Contracts to Somnia
```bash
npx hardhat run scripts/deploy.ts --network somnia
```
*Take the deployed `ALOCore` address and paste it into your `.env` file as `SOMNIA_ALO_CORE_ADDRESS`.*

### 4. Fund Your Agents
The agents need gas to execute transactions on your behalf. Grab some STT from the [Somnia Faucet](https://faucet.somnia.network/) and run:
```bash
npx hardhat run scripts/fund-agents.ts --network somnia
```

### 5. Launch the System

**Start the AI Swarm Worker (Terminal 1):**
```bash
npx ts-node scripts/listen-somnia.ts
```

**Start the Frontend Dashboard (Terminal 2):**
```bash
cd frontend
npm run dev
```

---

## Production Deployment

Ready to go live? Noventra is fully containerized and production-ready.

- **Frontend:** Pre-configured for seamless deployment to Vercel via `frontend/vercel.json`.
- **Agent Swarm:** Included `Dockerfile`, `docker-compose.yml`, and `Procfile` for deploying the 24/7 worker on Railway, AWS, or DigitalOcean.

See [DEPLOY.md](./DEPLOY.md) for detailed step-by-step production deployment instructions.

---

<div align="center">
  <p><i>Built for the Somnia Agentathon</i></p>
</div>
