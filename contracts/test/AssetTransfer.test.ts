import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("AssetTransfer", function () {
  let assetTransfer: Contract;
  let charonSwitch: Contract;
  let owner: HardhatEthersSigner;
  let user: HardhatEthersSigner;
  let beneficiary1: HardhatEthersSigner;
  let beneficiary2: HardhatEthersSigner;
  let mockToken: Contract;

  beforeEach(async function () {
    [owner, user, beneficiary1, beneficiary2] = await ethers.getSigners();

    // Deploy CharonSwitch first
    const CharonSwitch = await ethers.getContractFactory("CharonSwitch");
    charonSwitch = await CharonSwitch.deploy();
    await charonSwitch.waitForDeployment();

    // Deploy AssetTransfer
    const AssetTransfer = await ethers.getContractFactory("AssetTransfer");
    assetTransfer = await AssetTransfer.deploy(await charonSwitch.getAddress());
    await assetTransfer.waitForDeployment();

    // Deploy mock ERC-20 token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20.deploy("Test Token", "TEST", 18);
    await mockToken.waitForDeployment();

    // Mint tokens to user
    await mockToken.mint(user.address, ethers.parseEther("1000"));
  });

  describe("Initialization", function () {
    it("Should initialize beneficiaries correctly", async function () {
      const beneficiaries = [beneficiary1.address, beneficiary2.address];
      const percentages = [6000, 4000]; // 60% and 40% in basis points

      await assetTransfer.connect(user).initializeBeneficiaries(beneficiaries, percentages);

      const storedBeneficiaries = await assetTransfer.getBeneficiaries(user.address);
      expect(storedBeneficiaries.length).to.equal(2);
      expect(storedBeneficiaries[0].beneficiaryAddress).to.equal(beneficiary1.address);
      expect(storedBeneficiaries[0].percentage).to.equal(6000);
      expect(storedBeneficiaries[1].beneficiaryAddress).to.equal(beneficiary2.address);
      expect(storedBeneficiaries[1].percentage).to.equal(4000);
    });

    it("Should reject initialization with invalid percentages", async function () {
      const beneficiaries = [beneficiary1.address, beneficiary2.address];
      const percentages = [6000, 5000]; // Total > 100%

      await expect(
        assetTransfer.connect(user).initializeBeneficiaries(beneficiaries, percentages)
      ).to.be.revertedWithCustomError(assetTransfer, "PercentageExceeds100");
    });

    it("Should reject initialization with zero address", async function () {
      const beneficiaries = [ethers.ZeroAddress, beneficiary2.address];
      const percentages = [6000, 4000];

      await expect(
        assetTransfer.connect(user).initializeBeneficiaries(beneficiaries, percentages)
      ).to.be.revertedWithCustomError(assetTransfer, "InvalidBeneficiary");
    });
  });

  describe("Token Deposits", function () {
    beforeEach(async function () {
      // Initialize beneficiaries first
      const beneficiaries = [beneficiary1.address, beneficiary2.address];
      const percentages = [6000, 4000];
      await assetTransfer.connect(user).initializeBeneficiaries(beneficiaries, percentages);
    });

    it("Should allow token deposits when user is ALIVE", async function () {
      // Register user in CharonSwitch
      const guardians = [owner.address, owner.address, owner.address];
      await charonSwitch.connect(user).register(86400, guardians, 2);
      await charonSwitch.connect(user).pulse();

      const depositAmount = ethers.parseEther("100");
      await mockToken.connect(user).approve(await assetTransfer.getAddress(), depositAmount);
      await assetTransfer.connect(user).depositToken(await mockToken.getAddress(), depositAmount);

      const balance = await assetTransfer.getTokenBalance(user.address, await mockToken.getAddress());
      expect(balance).to.equal(depositAmount);
    });

    it("Should reject deposits when user is DECEASED", async function () {
      // Register user and mark as DECEASED
      const guardians = [owner.address, owner.address, owner.address];
      await charonSwitch.connect(user).register(86400, guardians, 2);
      
      // Mock oracle response to mark as DECEASED
      await charonSwitch.connect(owner).mockOracleResponse(
        ethers.keccak256(ethers.toUtf8Bytes("test")),
        true
      );

      const depositAmount = ethers.parseEther("100");
      await mockToken.connect(user).approve(await assetTransfer.getAddress(), depositAmount);
      
      await expect(
        assetTransfer.connect(user).depositToken(await mockToken.getAddress(), depositAmount)
      ).to.be.revertedWithCustomError(assetTransfer, "NotDeceased");
    });
  });

  describe("Asset Transfer on Death", function () {
    beforeEach(async function () {
      // Initialize beneficiaries
      const beneficiaries = [beneficiary1.address, beneficiary2.address];
      const percentages = [6000, 4000];
      await assetTransfer.connect(user).initializeBeneficiaries(beneficiaries, percentages);

      // Register user and deposit tokens
      const guardians = [owner.address, owner.address, owner.address];
      await charonSwitch.connect(user).register(86400, guardians, 2);
      await charonSwitch.connect(user).pulse();

      const depositAmount = ethers.parseEther("1000");
      await mockToken.connect(user).approve(await assetTransfer.getAddress(), depositAmount);
      await assetTransfer.connect(user).depositToken(await mockToken.getAddress(), depositAmount);
    });

    it("Should transfer assets to beneficiaries when user is DECEASED", async function () {
      // Mark user as DECEASED
      const requestId = ethers.keccak256(ethers.toUtf8Bytes("test"));
      await charonSwitch.connect(owner).mockOracleResponse(requestId, true);

      // Verify user is DECEASED
      const userInfo = await charonSwitch.getUserInfo(user.address);
      expect(userInfo[0]).to.equal(2); // DECEASED status

      // Transfer assets
      await assetTransfer.connect(owner).transferAssetsOnDeath(user.address);

      // Check balances
      const beneficiary1Balance = await mockToken.balanceOf(beneficiary1.address);
      const beneficiary2Balance = await mockToken.balanceOf(beneficiary2.address);

      // 60% of 1000 = 600 tokens
      expect(beneficiary1Balance).to.equal(ethers.parseEther("600"));
      // 40% of 1000 = 400 tokens
      expect(beneficiary2Balance).to.equal(ethers.parseEther("400"));

      // Vault should be empty
      const vaultBalance = await assetTransfer.getTokenBalance(user.address, await mockToken.getAddress());
      expect(vaultBalance).to.equal(0);
    });

    it("Should reject transfer when user is not DECEASED", async function () {
      await expect(
        assetTransfer.connect(owner).transferAssetsOnDeath(user.address)
      ).to.be.revertedWithCustomError(assetTransfer, "NotDeceased");
    });
  });

  describe("Sweep Wallet", function () {
    beforeEach(async function () {
      // Initialize beneficiaries
      const beneficiaries = [beneficiary1.address, beneficiary2.address];
      const percentages = [6000, 4000];
      await assetTransfer.connect(user).initializeBeneficiaries(beneficiaries, percentages);

      // Register user and deposit tokens
      const guardians = [owner.address, owner.address, owner.address];
      await charonSwitch.connect(user).register(86400, guardians, 2);
      await charonSwitch.connect(user).pulse();

      const depositAmount = ethers.parseEther("1000");
      await mockToken.connect(user).approve(await assetTransfer.getAddress(), depositAmount);
      await assetTransfer.connect(user).depositToken(await mockToken.getAddress(), depositAmount);
    });

    it("Should sweep all tokens to beneficiaries when user is DECEASED", async function () {
      // Mark user as DECEASED
      const requestId = ethers.keccak256(ethers.toUtf8Bytes("test"));
      await charonSwitch.connect(owner).mockOracleResponse(requestId, true);

      // Sweep wallet
      await assetTransfer.connect(owner).sweepWallet(user.address);

      // Check balances
      const beneficiary1Balance = await mockToken.balanceOf(beneficiary1.address);
      const beneficiary2Balance = await mockToken.balanceOf(beneficiary2.address);

      expect(beneficiary1Balance).to.equal(ethers.parseEther("600"));
      expect(beneficiary2Balance).to.equal(ethers.parseEther("400"));
    });

    it("Should reject sweep when user is not DECEASED", async function () {
      await expect(
        assetTransfer.connect(owner).sweepWallet(user.address)
      ).to.be.revertedWithCustomError(assetTransfer, "NotDeceased");
    });
  });

  describe("Multiple Tokens", function () {
    let mockToken2: Contract;

    beforeEach(async function () {
      // Deploy second mock token
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      mockToken2 = await MockERC20.deploy("Test Token 2", "TEST2", 18);
      await mockToken2.waitForDeployment();
      await mockToken2.mint(user.address, ethers.parseEther("500"));

      // Initialize beneficiaries
      const beneficiaries = [beneficiary1.address, beneficiary2.address];
      const percentages = [6000, 4000];
      await assetTransfer.connect(user).initializeBeneficiaries(beneficiaries, percentages);

      // Register user
      const guardians = [owner.address, owner.address, owner.address];
      await charonSwitch.connect(user).register(86400, guardians, 2);
      await charonSwitch.connect(user).pulse();

      // Deposit both tokens
      const amount1 = ethers.parseEther("1000");
      const amount2 = ethers.parseEther("500");
      await mockToken.connect(user).approve(await assetTransfer.getAddress(), amount1);
      await mockToken2.connect(user).approve(await assetTransfer.getAddress(), amount2);
      await assetTransfer.connect(user).depositToken(await mockToken.getAddress(), amount1);
      await assetTransfer.connect(user).depositToken(await mockToken2.getAddress(), amount2);
    });

    it("Should transfer all tokens in sweep", async function () {
      // Mark user as DECEASED
      const requestId = ethers.keccak256(ethers.toUtf8Bytes("test"));
      await charonSwitch.connect(owner).mockOracleResponse(requestId, true);

      // Sweep wallet
      await assetTransfer.connect(owner).sweepWallet(user.address);

      // Check balances for both tokens
      const ben1Token1 = await mockToken.balanceOf(beneficiary1.address);
      const ben2Token1 = await mockToken.balanceOf(beneficiary2.address);
      const ben1Token2 = await mockToken2.balanceOf(beneficiary1.address);
      const ben2Token2 = await mockToken2.balanceOf(beneficiary2.address);

      expect(ben1Token1).to.equal(ethers.parseEther("600"));
      expect(ben2Token1).to.equal(ethers.parseEther("400"));
      expect(ben1Token2).to.equal(ethers.parseEther("300"));
      expect(ben2Token2).to.equal(ethers.parseEther("200"));
    });
  });
});

// Mock ERC-20 contract for testing
const MockERC20ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address, uint256) returns (bool)",
  "function approve(address, uint256) returns (bool)",
  "function mint(address, uint256)",
];

