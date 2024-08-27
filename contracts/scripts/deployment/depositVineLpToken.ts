import { ethers } from "hardhat";

const { contracts } = require("../config/index.ts");

const lpToken = "0xf1E00B2B98d9c796963C4251738f5f6e2b31453d";
const trove = "0x06eBC049Fa9d394Aa660E79b94c0278C677ba773";
// from the old bit
const lpOracle = "0x6b7BC9dD2b851587863fa5c77636869fe1206d9a";

async function main() {
  const [deployer] = await ethers.getSigners();

  const depositBitLpToken = await ethers.getContractFactory(
    "DepositBitLpToken",
    deployer
  );
  const contract = await depositBitLpToken.deploy(
    contracts["BitToken"].address,
    lpToken,
    contracts["BitVault"].address,
    trove,
    contracts["BitCore"].address,
    lpOracle
  );
  await contract.waitForDeployment();

  console.log("DepositBitLpToken deployed to:", await contract.getAddress());
}

main()
  .then(() => console.log("DepositBitLpToken deployed"))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
