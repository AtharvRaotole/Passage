import { ethers } from "hardhat";

async function main() {
  console.log("Deploying CharonSwitch contract...");

  const CharonSwitch = await ethers.getContractFactory("CharonSwitch");
  const charonSwitch = await CharonSwitch.deploy();

  await charonSwitch.waitForDeployment();

  const address = await charonSwitch.getAddress();
  console.log("CharonSwitch deployed to:", address);
  console.log("\nContract ready for use!");
  console.log("You can now:");
  console.log("1. Register users with guardians");
  console.log("2. Send heartbeats using pulse()");
  console.log("3. Initiate verification when threshold is exceeded");
  console.log("4. Use mockOracleResponse() to simulate Chainlink callbacks");
  console.log("5. Have guardians confirm if oracle is unsure");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

