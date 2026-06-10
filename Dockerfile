# ═══════════════════════════════════════════════════════════════
#  Noventra Agent Swarm — Dockerfile
#  Builds the TypeScript agent swarm as a lean production image.
# ═══════════════════════════════════════════════════════════════

# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (cache layer)
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci --ignore-scripts

# Copy source
COPY agents/       ./agents/
COPY interfaces/   ./interfaces/
COPY scripts/      ./scripts/
COPY contracts/    ./contracts/
COPY deployments/  ./deployments/
COPY hardhat.config.ts ./

# Compile contracts (needed for ABI resolution in agents)
RUN npx hardhat compile

# ── Stage 2: Production runtime ─────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

# Only copy what's needed to run
COPY --from=builder /app/node_modules    ./node_modules
COPY --from=builder /app/artifacts       ./artifacts
COPY --from=builder /app/typechain-types ./typechain-types
COPY --from=builder /app/agents          ./agents
COPY --from=builder /app/interfaces      ./interfaces
COPY --from=builder /app/scripts         ./scripts
COPY --from=builder /app/contracts       ./contracts
COPY --from=builder /app/deployments     ./deployments
COPY --from=builder /app/hardhat.config.ts ./
COPY --from=builder /app/tsconfig.json   ./
COPY --from=builder /app/package.json    ./

# Create non-root user for security
RUN addgroup -S noventra && adduser -S noventra -G noventra
USER noventra

# Health check — verify the process is still running
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD pgrep -f "listen-somnia" || exit 1

# Run the agent swarm via ts-node (no separate compile step required)
CMD ["node", "--require", "ts-node/register", "scripts/listen-somnia.ts"]
