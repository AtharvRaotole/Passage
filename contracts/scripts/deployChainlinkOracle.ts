import { ethers } from "hardhat";

async function main() {
  // Chainlink Functions Router address for Mumbai
  const routerAddress = process.env.CHAINLINK_FUNCTIONS_ROUTER || "";
  const donId = process.env.CHAINLINK_DON_ID || ethers.id("1");
  const charonSwitchAddress = process.env.CHARON_SWITCH_ADDRESS || "";
  const apiEndpoint = process.env.DEATH_VERIFICATION_API || "https://api.searchbug.com/v1/death-verification";

  if (!routerAddress) {
    throw new Error("CHAINLINK_FUNCTIONS_ROUTER environment variable is required");
  }

  if (!charonSwitchAddress) {
    throw new Error("CHARON_SWITCH_ADDRESS environment variable is required");
  }

  console.log("Deploying ChainlinkOracle contract...");
  console.log("Router address:", routerAddress);
  console.log("DON ID:", donId);
  console.log("CharonSwitch address:", charonSwitchAddress);
  console.log("API Endpoint:", apiEndpoint);

  const ChainlinkOracle = await ethers.getContractFactory("ChainlinkOracle");
  const oracle = await ChainlinkOracle.deploy(
    routerAddress,
    donId,
    charonSwitchAddress,
    apiEndpoint
  );

  await oracle.waitForDeployment();

  const address = await oracle.getAddress();
  console.log("ChainlinkOracle deployed to:", address);
  console.log("\nNext steps:");
  console.log("1. Set subscription ID: await oracle.setSubscriptionId(YOUR_SUBSCRIPTION_ID)");
  console.log("2. Fund the subscription with LINK tokens");
  console.log("3. Update CharonSwitch: await charonSwitch.setChainlinkOracle('" + address + "')");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

