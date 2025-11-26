import { ethers } from "hardhat";

async function main() {
  // Chainlink Functions Router address (update for your network)
  const routerAddress = process.env.CHAINLINK_FUNCTIONS_ROUTER || "";
  const donId = process.env.CHAINLINK_DON_ID || ethers.id("1");

  if (!routerAddress) {
    throw new Error("CHAINLINK_FUNCTIONS_ROUTER environment variable is required");
  }

  console.log("Deploying DeadMansSwitch contract...");
  console.log("Router address:", routerAddress);
  console.log("DON ID:", donId);

  const DeadMansSwitch = await ethers.getContractFactory("DeadMansSwitch");
  const deadMansSwitch = await DeadMansSwitch.deploy(routerAddress, donId);

  await deadMansSwitch.waitForDeployment();

  const address = await deadMansSwitch.getAddress();
  console.log("DeadMansSwitch deployed to:", address);
  console.log("\nNext steps:");
  console.log("1. Set the subscription ID: await contract.setSubscriptionId(YOUR_SUBSCRIPTION_ID)");
  console.log("2. Fund the subscription with LINK tokens");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

