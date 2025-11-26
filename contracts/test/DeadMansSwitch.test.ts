import { expect } from "chai";
import { ethers } from "hardhat";
import { DeadMansSwitch } from "../typechain-types";

describe("DeadMansSwitch", function () {
  let deadMansSwitch: DeadMansSwitch;
  let owner: any;
  let beneficiary: any;
  let otherAccount: any;

  beforeEach(async function () {
    [owner, beneficiary, otherAccount] = await ethers.getSigners();

    // Mock Chainlink Functions Oracle (simplified for testing)
    const mockOracle = ethers.ZeroAddress;
    const mockDonId = ethers.id("test-don");

    const DeadMansSwitchFactory = await ethers.getContractFactory("DeadMansSwitch");
    deadMansSwitch = await DeadMansSwitchFactory.deploy(mockOracle, mockDonId);
    await deadMansSwitch.waitForDeployment();
  });

  describe("Estate Creation", function () {
    it("Should create an estate", async function () {
      const heartbeatInterval = 86400; // 1 day
      const source = "https://api.example.com/activity";
      const secrets = "encrypted_secrets";

      await expect(
        deadMansSwitch.createEstate(
          beneficiary.address,
          heartbeatInterval,
          source,
          secrets
        )
      ).to.emit(deadMansSwitch, "EstateCreated");

      const estate = await deadMansSwitch.getEstate(owner.address);
      expect(estate.beneficiary).to.equal(beneficiary.address);
      expect(estate.heartbeatInterval).to.equal(heartbeatInterval);
      expect(estate.isActive).to.be.true;
    });

    it("Should reject invalid beneficiary", async function () {
      await expect(
        deadMansSwitch.createEstate(
          ethers.ZeroAddress,
          86400,
          "https://api.example.com",
          "secrets"
        )
      ).to.be.revertedWithCustomError(deadMansSwitch, "InvalidBeneficiary");
    });

    it("Should reject interval less than 1 day", async function () {
      await expect(
        deadMansSwitch.createEstate(
          beneficiary.address,
          3600, // 1 hour
          "https://api.example.com",
          "secrets"
        )
      ).to.be.revertedWithCustomError(deadMansSwitch, "InvalidInterval");
    });
  });

  describe("Estate Management", function () {
    beforeEach(async function () {
      await deadMansSwitch.createEstate(
        beneficiary.address,
        86400,
        "https://api.example.com",
        "secrets"
      );
    });

    it("Should update encrypted data", async function () {
      const encryptedData = ethers.toUtf8Bytes("encrypted_data");
      await deadMansSwitch.updateEncryptedData(encryptedData);

      const estate = await deadMansSwitch.getEstate(owner.address);
      expect(estate.encryptedData).to.equal(ethers.hexlify(encryptedData));
    });
  });
});

