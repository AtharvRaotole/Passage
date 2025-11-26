import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying AssetTransfer with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Get CharonSwitch address from environment or use a default
  const charonSwitchAddress = process.env.CHARON_SWITCH_ADDRESS || "0x0000000000000000000000000000000000000000";
  
  if (charonSwitchAddress === "0x0000000000000000000000000000000000000000") {
    throw new Error("Please set CHARON_SWITCH_ADDRESS in .env file");
  }

  const AssetTransfer = await ethers.getContractFactory("AssetTransfer");
  const assetTransfer = await AssetTransfer.deploy(charonSwitchAddress);

  await assetTransfer.waitForDeployment();

  const address = await assetTransfer.getAddress();
  console.log("AssetTransfer deployed to:", address);
  console.log("CharonSwitch address:", charonSwitchAddress);

  // Verify deployment
  console.log("\nVerifying deployment...");
  const owner = await assetTransfer.owner();
  const charonSwitch = await assetTransfer.charonSwitch();
  
  console.log("Owner:", owner);
  console.log("CharonSwitch:", charonSwitch);
  console.log("\nDeployment successful!");
  
  console.log("\nNext steps:");
  console.log("1. Update frontend with AssetTransfer address:", address);
  console.log("2. Update .env with ASSET_TRANSFER_ADDRESS=", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

