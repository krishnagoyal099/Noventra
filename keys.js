const { ethers } = require("ethers");
const mnemonic = ethers.Mnemonic.fromPhrase("test test test test test test test test test test test junk");
for(let i=0; i<6; i++) {
  const wallet = ethers.HDNodeWallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/" + i);
  console.log(i, wallet.privateKey, wallet.address);
}
