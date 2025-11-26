import { expect } from "chai";
import { ethers } from "hardhat";
import { CharonSwitch } from "../typechain-types";

describe("CharonSwitch", function () {
  let charonSwitch: CharonSwitch;
  let owner: any;
  let user: any;
  let guardian1: any;
  let guardian2: any;
  let guardian3: any;
  let otherAccount: any;

  const THRESHOLD = 3600; // 1 hour in seconds

  beforeEach(async function () {
    [owner, user, guardian1, guardian2, guardian3, otherAccount] =
      await ethers.getSigners();

    const CharonSwitchFactory = await ethers.getContractFactory("CharonSwitch");
    charonSwitch = await CharonSwitchFactory.deploy();
    await charonSwitch.waitForDeployment();
  });

  describe("Registration", function () {
    it("Should register a user with guardians", async function () {
      const guardians = [
        guardian1.address,
        guardian2.address,
        guardian3.address,
      ];
      const requiredConfirmations = 2; // 2-of-3

      await expect(
        charonSwitch
          .connect(user)
          .register(THRESHOLD, guardians, requiredConfirmations)
      ).to.not.be.reverted;

      const userInfo = await charonSwitch.getUserInfo(user.address);
      expect(userInfo.status).to.equal(0); // ALIVE
      expect(userInfo.threshold).to.equal(THRESHOLD);
      expect(userInfo.guardians[0]).to.equal(guardian1.address);
      expect(userInfo.guardians[1]).to.equal(guardian2.address);
      expect(userInfo.guardians[2]).to.equal(guardian3.address);
      expect(userInfo.requiredConfirmations).to.equal(requiredConfirmations);
    });

    it("Should reject registration with zero threshold", async function () {
      const guardians = [
        guardian1.address,
        guardian2.address,
        guardian3.address,
      ];

      await expect(
        charonSwitch
          .connect(user)
          .register(0, guardians, 2)
      ).to.be.revertedWithCustomError(charonSwitch, "InvalidThreshold");
    });

    it("Should reject registration with invalid guardian (zero address)", async function () {
      const guardians = [
        ethers.ZeroAddress,
        guardian2.address,
        guardian3.address,
      ];

      await expect(
        charonSwitch
          .connect(user)
          .register(THRESHOLD, guardians, 2)
      ).to.be.revertedWithCustomError(charonSwitch, "InvalidGuardian");
    });

    it("Should reject registration with user as guardian", async function () {
      const guardians = [
        user.address,
        guardian2.address,
        guardian3.address,
      ];

      await expect(
        charonSwitch
          .connect(user)
          .register(THRESHOLD, guardians, 2)
      ).to.be.revertedWithCustomError(charonSwitch, "InvalidGuardian");
    });

    it("Should reject registration with duplicate guardians", async function () {
      const guardians = [
        guardian1.address,
        guardian1.address,
        guardian3.address,
      ];

      await expect(
        charonSwitch
          .connect(user)
          .register(THRESHOLD, guardians, 2)
      ).to.be.revertedWithCustomError(charonSwitch, "DuplicateGuardian");
    });

    it("Should reject registration with invalid required confirmations", async function () {
      const guardians = [
        guardian1.address,
        guardian2.address,
        guardian3.address,
      ];

      await expect(
        charonSwitch
          .connect(user)
          .register(THRESHOLD, guardians, 0)
      ).to.be.revertedWithCustomError(charonSwitch, "InsufficientConfirmations");

      await expect(
        charonSwitch
          .connect(user)
          .register(THRESHOLD, guardians, 4)
      ).to.be.revertedWithCustomError(charonSwitch, "InsufficientConfirmations");
    });
  });

  describe("Heartbeat (pulse)", function () {
    beforeEach(async function () {
      const guardians = [
        guardian1.address,
        guardian2.address,
        guardian3.address,
      ];
      await charonSwitch
        .connect(user)
        .register(THRESHOLD, guardians, 2);
    });

    it("Should update lastSeen timestamp", async function () {
      const initialInfo = await charonSwitch.getUserInfo(user.address);
      const initialLastSeen = initialInfo.lastSeen;

      // Wait a bit
      await ethers.provider.send("evm_increaseTime", [100]);
      await ethers.provider.send("evm_mine", []);

      await expect(charonSwitch.connect(user).pulse())
        .to.emit(charonSwitch, "Heartbeat")
        .withArgs(user.address, (value: any) => value > initialLastSeen);

      const updatedInfo = await charonSwitch.getUserInfo(user.address);
      expect(updatedInfo.lastSeen).to.be.gt(initialLastSeen);
    });

    it("Should reset status from PENDING_VERIFICATION to ALIVE", async function () {
      // Move time forward past threshold
      await ethers.provider.send("evm_increaseTime", [THRESHOLD + 1]);
      await ethers.provider.send("evm_mine", []);

      // Initiate verification
      await charonSwitch.connect(user).initiateVerification();

      // Verify status is PENDING_VERIFICATION
      let userInfo = await charonSwitch.getUserInfo(user.address);
      expect(userInfo.status).to.equal(1); // PENDING_VERIFICATION

      // Send pulse
      await charonSwitch.connect(user).pulse();

      // Verify status is back to ALIVE
      userInfo = await charonSwitch.getUserInfo(user.address);
      expect(userInfo.status).to.equal(0); // ALIVE
    });

    it("Should reject pulse from unregistered user", async function () {
      await expect(
        charonSwitch.connect(otherAccount).pulse()
      ).to.be.revertedWithCustomError(charonSwitch, "UserNotRegistered");
    });
  });

  describe("Verification", function () {
    beforeEach(async function () {
      const guardians = [
        guardian1.address,
        guardian2.address,
        guardian3.address,
      ];
      await charonSwitch
        .connect(user)
        .register(THRESHOLD, guardians, 2);
    });

    it("Should initiate verification when threshold exceeded", async function () {
      // Move time forward past threshold
      await ethers.provider.send("evm_increaseTime", [THRESHOLD + 1]);
      await ethers.provider.send("evm_mine", []);

      await expect(charonSwitch.connect(user).initiateVerification())
        .to.emit(charonSwitch, "VerificationInitiated")
        .to.emit(charonSwitch, "StatusChanged")
        .withArgs(user.address, 0, 1); // ALIVE -> PENDING_VERIFICATION

      const userInfo = await charonSwitch.getUserInfo(user.address);
      expect(userInfo.status).to.equal(1); // PENDING_VERIFICATION
    });

    it("Should reject verification if threshold not exceeded", async function () {
      await expect(
        charonSwitch.connect(user).initiateVerification()
      ).to.be.revertedWithCustomError(charonSwitch, "InvalidStatusTransition");
    });

    it("Should reject verification if user not ALIVE", async function () {
      // Move time forward
      await ethers.provider.send("evm_increaseTime", [THRESHOLD + 1]);
      await ethers.provider.send("evm_mine", []);

      // Initiate verification
      await charonSwitch.connect(user).initiateVerification();

      // Try to initiate again
      await expect(
        charonSwitch.connect(user).initiateVerification()
      ).to.be.revertedWithCustomError(charonSwitch, "InvalidStatusTransition");
    });
  });

  describe("Oracle Response", function () {
    let requestId: string;

    beforeEach(async function () {
      const guardians = [
        guardian1.address,
        guardian2.address,
        guardian3.address,
      ];
      await charonSwitch
        .connect(user)
        .register(THRESHOLD, guardians, 2);

      // Move time forward and initiate verification
      await ethers.provider.send("evm_increaseTime", [THRESHOLD + 1]);
      await ethers.provider.send("evm_mine", []);

      const tx = await charonSwitch.connect(user).initiateVerification();
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) =>
          log.topics[0] ===
          ethers.id("VerificationInitiated(address,bytes32)")
      );
      if (event) {
        requestId = ethers.hexlify(event.topics[2]);
      }
    });

    it("Should mark user as DECEASED when oracle confirms death", async function () {
      await expect(
        charonSwitch.mockOracleResponse(requestId, true)
      )
        .to.emit(charonSwitch, "OracleResponse")
        .withArgs(user.address, true)
        .to.emit(charonSwitch, "StatusChanged")
        .withArgs(user.address, 1, 2); // PENDING_VERIFICATION -> DECEASED

      const userInfo = await charonSwitch.getUserInfo(user.address);
      expect(userInfo.status).to.equal(2); // DECEASED
    });

    it("Should remain PENDING_VERIFICATION when oracle is unsure", async function () {
      await expect(
        charonSwitch.mockOracleResponse(requestId, false)
      )
        .to.emit(charonSwitch, "OracleResponse")
        .withArgs(user.address, false);

      const userInfo = await charonSwitch.getUserInfo(user.address);
      expect(userInfo.status).to.equal(1); // PENDING_VERIFICATION
    });

    it("Should reject oracle response for invalid request", async function () {
      const invalidRequestId = ethers.id("invalid");
      await expect(
        charonSwitch.mockOracleResponse(invalidRequestId, true)
      ).to.be.revertedWithCustomError(charonSwitch, "VerificationNotPending");
    });
  });

  describe("Guardian System", function () {
    let requestId: string;

    beforeEach(async function () {
      const guardians = [
        guardian1.address,
        guardian2.address,
        guardian3.address,
      ];
      await charonSwitch
        .connect(user)
        .register(THRESHOLD, guardians, 2);

      // Move time forward and initiate verification
      await ethers.provider.send("evm_increaseTime", [THRESHOLD + 1]);
      await ethers.provider.send("evm_mine", []);

      const tx = await charonSwitch.connect(user).initiateVerification();
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) =>
          log.topics[0] ===
          ethers.id("VerificationInitiated(address,bytes32)")
      );
      if (event) {
        requestId = ethers.hexlify(event.topics[2]);
      }

      // Oracle is unsure
      await charonSwitch.mockOracleResponse(requestId, false);
    });

    it("Should allow guardian to confirm", async function () {
      await expect(
        charonSwitch.connect(guardian1).guardianConfirm(user.address)
      )
        .to.emit(charonSwitch, "GuardianConfirmed")
        .withArgs(user.address, guardian1.address);

      const confirmed = await charonSwitch.hasGuardianConfirmed(
        user.address,
        guardian1.address
      );
      expect(confirmed).to.be.true;
    });

    it("Should mark user as DECEASED when required confirmations are met", async function () {
      // First guardian confirms
      await charonSwitch.connect(guardian1).guardianConfirm(user.address);
      let userInfo = await charonSwitch.getUserInfo(user.address);
      expect(userInfo.status).to.equal(1); // Still PENDING_VERIFICATION
      expect(userInfo.confirmationCount).to.equal(1);

      // Second guardian confirms (2-of-3 threshold met)
      await expect(
        charonSwitch.connect(guardian2).guardianConfirm(user.address)
      )
        .to.emit(charonSwitch, "GuardianConfirmed")
        .to.emit(charonSwitch, "StatusChanged")
        .withArgs(user.address, 1, 2); // PENDING_VERIFICATION -> DECEASED

      userInfo = await charonSwitch.getUserInfo(user.address);
      expect(userInfo.status).to.equal(2); // DECEASED
      expect(userInfo.confirmationCount).to.equal(2);
    });

    it("Should reject confirmation from non-guardian", async function () {
      await expect(
        charonSwitch.connect(otherAccount).guardianConfirm(user.address)
      ).to.be.revertedWithCustomError(charonSwitch, "InvalidGuardian");
    });

    it("Should reject duplicate confirmation from same guardian", async function () {
      await charonSwitch.connect(guardian1).guardianConfirm(user.address);

      await expect(
        charonSwitch.connect(guardian1).guardianConfirm(user.address)
      ).to.be.revertedWithCustomError(charonSwitch, "AlreadyConfirmed");
    });

    it("Should reject confirmation when user is not PENDING_VERIFICATION", async function () {
      // Reset by sending pulse
      await charonSwitch.connect(user).pulse();

      await expect(
        charonSwitch.connect(guardian1).guardianConfirm(user.address)
      ).to.be.revertedWithCustomError(charonSwitch, "VerificationNotPending");
    });

    it("Should work with 1-of-3 confirmation requirement", async function () {
      // Register new user with 1-of-3 requirement
      const newUser = otherAccount;
      const guardians = [
        guardian1.address,
        guardian2.address,
        guardian3.address,
      ];
      await charonSwitch
        .connect(newUser)
        .register(THRESHOLD, guardians, 1);

      // Move time forward and initiate verification
      await ethers.provider.send("evm_increaseTime", [THRESHOLD + 1]);
      await ethers.provider.send("evm_mine", []);

      const tx = await charonSwitch.connect(newUser).initiateVerification();
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) =>
          log.topics[0] ===
          ethers.id("VerificationInitiated(address,bytes32)")
      );
      let newRequestId = "";
      if (event) {
        newRequestId = ethers.hexlify(event.topics[2]);
      }

      // Oracle is unsure
      await charonSwitch.mockOracleResponse(newRequestId, false);

      // Single guardian confirmation should be enough
      await expect(
        charonSwitch.connect(guardian1).guardianConfirm(newUser.address)
      )
        .to.emit(charonSwitch, "StatusChanged")
        .withArgs(newUser.address, 1, 2); // PENDING_VERIFICATION -> DECEASED

      const userInfo = await charonSwitch.getUserInfo(newUser.address);
      expect(userInfo.status).to.equal(2); // DECEASED
    });
  });

  describe("State Transitions", function () {
    beforeEach(async function () {
      const guardians = [
        guardian1.address,
        guardian2.address,
        guardian3.address,
      ];
      await charonSwitch
        .connect(user)
        .register(THRESHOLD, guardians, 2);
    });

    it("Should handle complete lifecycle: ALIVE -> PENDING -> ALIVE (via pulse)", async function () {
      // Start ALIVE
      let userInfo = await charonSwitch.getUserInfo(user.address);
      expect(userInfo.status).to.equal(0); // ALIVE

      // Move to PENDING_VERIFICATION
      await ethers.provider.send("evm_increaseTime", [THRESHOLD + 1]);
      await ethers.provider.send("evm_mine", []);
      await charonSwitch.connect(user).initiateVerification();
      userInfo = await charonSwitch.getUserInfo(user.address);
      expect(userInfo.status).to.equal(1); // PENDING_VERIFICATION

      // Back to ALIVE via pulse
      await charonSwitch.connect(user).pulse();
      userInfo = await charonSwitch.getUserInfo(user.address);
      expect(userInfo.status).to.equal(0); // ALIVE
    });

    it("Should handle complete lifecycle: ALIVE -> PENDING -> DECEASED (via oracle)", async function () {
      // Move to PENDING_VERIFICATION
      await ethers.provider.send("evm_increaseTime", [THRESHOLD + 1]);
      await ethers.provider.send("evm_mine", []);
      const tx = await charonSwitch.connect(user).initiateVerification();
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) =>
          log.topics[0] ===
          ethers.id("VerificationInitiated(address,bytes32)")
      );
      let requestId = "";
      if (event) {
        requestId = ethers.hexlify(event.topics[2]);
      }

      // Oracle confirms death
      await charonSwitch.mockOracleResponse(requestId, true);
      const userInfo = await charonSwitch.getUserInfo(user.address);
      expect(userInfo.status).to.equal(2); // DECEASED
    });

    it("Should handle complete lifecycle: ALIVE -> PENDING -> DECEASED (via guardians)", async function () {
      // Move to PENDING_VERIFICATION
      await ethers.provider.send("evm_increaseTime", [THRESHOLD + 1]);
      await ethers.provider.send("evm_mine", []);
      const tx = await charonSwitch.connect(user).initiateVerification();
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) =>
          log.topics[0] ===
          ethers.id("VerificationInitiated(address,bytes32)")
      );
      let requestId = "";
      if (event) {
        requestId = ethers.hexlify(event.topics[2]);
      }

      // Oracle is unsure
      await charonSwitch.mockOracleResponse(requestId, false);

      // Guardians confirm
      await charonSwitch.connect(guardian1).guardianConfirm(user.address);
      await charonSwitch.connect(guardian2).guardianConfirm(user.address);

      const userInfo = await charonSwitch.getUserInfo(user.address);
      expect(userInfo.status).to.equal(2); // DECEASED
    });
  });
});

