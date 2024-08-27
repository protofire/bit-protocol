import { Wallet } from "ethers";
import hre from "hardhat";

const NETWORK = process.env.NETWORK || "localhost";

const { adminPrivateKey } = require(`../config/${NETWORK}.ts`);
const { contracts } = require("../config/index.ts");

const addressZero = "0x0000000000000000000000000000000000000000";

async function main() {
  const adminWallet = new Wallet(adminPrivateKey, hre.ethers.provider);

  const signer = await hre.ethers.getSigner(adminWallet.address);

  const core = await hre.ethers.getContractAt(
    "BitCore",
    contracts["BitCore"].address,
    signer
  );

  const debtToken = await hre.ethers.getContractAt(
    "DebtToken",
    contracts["DebtToken"].address,
    signer
  );

  const factory = await hre.ethers.getContractAt(
    "Factory",
    contracts["Factory"].address,
    signer
  );

  const stabilityPool = await hre.ethers.getContractAt(
    "StabilityPool",
    contracts["StabilityPool"].address,
    signer
  );

  const incentiveVoting = await hre.ethers.getContractAt(
    "IncentiveVoting",
    contracts["IncentiveVoting"].address,
    signer
  );

  const bitVault = await hre.ethers.getContractAt(
    "BitVault",
    contracts["BitVault"].address,
    signer
  );

  const bitToken = await hre.ethers.getContractAt(
    "BitToken",
    contracts["BitToken"].address,
    signer
  );

  // CORE CONFIG
  await core.setFeeReceiver(contracts["FeeReceiver"].address);
  await core.setPriceFeed(contracts["PriceFeed"].address);

  // BitToken config
  await bitToken.setInitialParameters(
    contracts["BitVault"].address,
    contracts["TokenLocker"].address
  );

  // DebtToken config
  await debtToken.setInitialParameters(
    contracts["Factory"].address,
    contracts["GasPool"].address,
    contracts["StabilityPool"].address,
    contracts["BorrowerOperations"].address
  );

  // FACTORY CONFIG
  await factory.setInitialParameters(
    contracts["StabilityPool"].address,
    contracts["BorrowerOperations"].address,
    contracts["SortedTroves"].address,
    contracts["TroveManager"].address,
    contracts["LiquidationManager"].address
  );

  const tx = await factory.deployNewInstance(
    "0xf766051EA4FD0721948D78caFa35974D44954e9A",
    contracts["PriceFeed"].address,
    addressZero, // address(0) to use the default
    addressZero, // address(0) to use the default
    {
      minuteDecayFactor: "999037758833783000",
      redemptionFeeFloor: "5000000000000000",
      maxRedemptionFee: "1000000000000000000",
      borrowingFeeFloor: "5000000000000000",
      maxBorrowingFee: "50000000000000000",
      interestRateInBps: "100",
      maxDebt: "10000000000000000000000000000",
      MCR: "1500000000000000000",
    }
  );

  await tx.wait();

  const troveManagerDeployment = await factory.troveManagers(0);

  const troveManager = await hre.ethers.getContractAt(
    "TroveManager",
    troveManagerDeployment,
    signer
  );

  const sortedTrove = await troveManager.sortedTroves();

  // StabilityPool config
  await stabilityPool.setInitialParameters(
    contracts["BitVault"].address,
    contracts["LiquidationManager"].address
  );

  // INCENTIVE VOTING CONFIG
  await incentiveVoting.setInitialParameters(
    contracts["TokenLocker"].address,
    contracts["BitVault"].address
  );

  // BitVault config
  await bitVault.setInitialParameters(
    contracts["EmissionSchedule"].address,
    contracts["BoostCalculator"].address,
    "100000000000000000000000000",
    "19",
    [],
    [
      {
        receiver: adminWallet.address,
        amount: "1700000000000000000000000",
      },
      {
        receiver: contracts["IDOTokenVesting"].address,
        amount: "5300000000000000000000000",
      },
      {
        receiver: contracts["TokenVesting"].address,
        amount: "38000000000000000000000000",
      },
    ]
  );

  await bitToken.transferFrom(
    contracts["BitVault"].address,
    adminWallet.address,
    "1510000000000000000000000"
  );
}

main()
  .then(() => console.log("Core contracts initilized"))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
