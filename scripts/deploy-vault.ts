/**
 * ═══════════════════════════════════════════════════════════════════
 *  ALO — Deploy NoventraVault to Somnia Testnet
 * ═══════════════════════════════════════════════════════════════════
 *  Run: npx hardhat run scripts/deploy-vault.ts --network somnia
 * ═══════════════════════════════════════════════════════════════════
 */

import { ethers as hardhatEthers } from "hardhat";
import { JsonRpcProvider, Wallet, ContractFactory } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

const ALO_CORE_ADDRESS = "0x6513684C358cD6d92Ad43225Ad9B8e3B81f01398";
const EXPLORER = "https://shannon-explorer.somnia.network";
const RPC_URL = process.env.SOMNIA_RPC_URL || "https://dream-rpc.somnia.network";

// Somnia provider workaround (same as demo-somnia.ts)
class SomniaProvider extends JsonRpcProvider {
  private static readonly GAS_CAP = 5_000_000n;
  override async send(method: string, params: Array<any>): Promise<any> {
    const result = await super.send(method, params);
    if (method === "eth_getLogs" && Array.isArray(result)) {
      return result.map((log: any) => ({ ...log, removed: log.removed ?? false }));
    }
    if (method === "eth_estimateGas") {
      const estimated = BigInt(result);
      if (estimated > SomniaProvider.GAS_CAP) return "0x" + SomniaProvider.GAS_CAP.toString(16);
    }
    return result;
  }
}

async function main() {
  const deployerKey = process.env.PRIVATE_KEY;
  if (!deployerKey) throw new Error("Missing PRIVATE_KEY in .env");

  const provider = new SomniaProvider(RPC_URL);
  const deployer = new Wallet(deployerKey, provider);
  const balance = await provider.getBalance(deployer.address);

  console.log("\n🏦 Deploying NoventraVault to Somnia Testnet...\n");
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Balance:  ${hardhatEthers.formatEther(balance)} STT\n`);

  // ─── Get the compiled artifact via hardhat ───
  const VaultArtifact = await hardhatEthers.getContractFactory("NoventraVault");
  
  // ─── Deploy via raw ethers with SomniaProvider ───
  const factory = new ContractFactory(VaultArtifact.interface, VaultArtifact.bytecode, deployer);
  const deployTx = await factory.getDeployTransaction();
  
  const sentTx = await deployer.sendTransaction({
    ...deployTx,
    gasLimit: 3_000_000,
    maxFeePerGas: 7_000_000_000n,
    maxPriorityFeePerGas: 7_000_000_000n,
  });

  console.log(`⏳ Deployment tx sent: ${sentTx.hash}`);
  console.log(`   ${EXPLORER}/tx/${sentTx.hash}`);

  const receipt = await sentTx.wait();
  if (!receipt || !receipt.contractAddress) throw new Error("Deployment failed — no contract address");

  const vaultAddr = receipt.contractAddress;
  console.log(`\n✅ NoventraVault deployed!`);
  console.log(`   Address: ${vaultAddr}`);
  console.log(`   Explorer: ${EXPLORER}/address/${vaultAddr}\n`);

  // ─── Wire ALOCore ───
  console.log(`🔗 Setting ALOCore reference on Vault...`);
  const vaultContract = VaultArtifact.attach(vaultAddr).connect(deployer) as any;
  const setTx = await vaultContract.setALOCore(ALO_CORE_ADDRESS, {
    gasLimit: 200_000,
    maxFeePerGas: 7_000_000_000n,
    maxPriorityFeePerGas: 7_000_000_000n,
  });
  await setTx.wait();
  console.log(`   ✅ ALOCore set to ${ALO_CORE_ADDRESS}\n`);

  console.log("═══════════════════════════════════════════════════");
  console.log("🎉 NoventraVault is live!");
  console.log("═══════════════════════════════════════════════════");
  console.log(`Vault Address: ${vaultAddr}`);
  console.log("\n📋 Update the frontend:");
  console.log(`   const VAULT_ADDRESS = "${vaultAddr}";`);
  console.log("═══════════════════════════════════════════════════\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
