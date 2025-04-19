const express = require("express");
const { ethers } = require("ethers");
const router = express.Router();
const Contract = require("../models/Contract");

// Import ABI and bytecode for both contracts
const contractABI1 = require("../contracts/ConditionalPayment.json").abi;
const bytecode1 = require("../contracts/ConditionalPayment.json").bytecode;
const contractABI2 = require("../contracts/VendorPayment.json").abi;
const bytecode2 = require("../contracts/VendorPayment.json").bytecode;

// Initialize provider and signer using Alchemy and private key
const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_API);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

/**
 * Deploy ConditionalVendorPayment contract
 * POST /deploy/conditionalContract
 */
router.post("/deploy/conditionalContract", async (req, res) => {
  try {
    const { payee, amount } = req.body;

    // Deploy smart contract with payee and ETH value
    const factory = new ethers.ContractFactory(contractABI1, bytecode1, wallet);
    const contract = await factory.deploy(payee, {
      value: ethers.parseEther(amount)
    });
    await contract.waitForDeployment();

    // Save contract info in MongoDB
    await Contract.create({
      type: "Conditional",
      address: contract.target,
      payer: wallet.address,
      payee,
      amount,
      confirmed: false,
      paid: false
    });

    res.json({ contractAddress: contract.target });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get payment status of a ConditionalVendorPayment contract
 * GET /conditionalContractStatus/:address
 */
router.get("/conditionalContractStatus/:address", async (req, res) => {
  try {
    const { address } = req.params;

    const contract = new ethers.Contract(address, contractABI1, wallet);

    const paid = await contract.getStatus(); // calls getStatus() from contract
    res.json({ address, paid });
  } catch (err) {
    console.error("Status error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Confirm delivery for ConditionalVendorPayment contract
 * POST /conditionalContractConfirm/:address
 */
router.post("/conditionalContractConfirm/:address", async (req, res) => {
  try {
    const { address } = req.params;

    const contract = new ethers.Contract(address, contractABI1, wallet);
    const tx = await contract.confirmDelivery(); // triggers confirmDelivery()
    await tx.wait();

    // Update delivery confirmation status in DB
    await Contract.updateOne({ address }, { confirmed: true });

    res.json({ message: "Delivery confirmed" });
  } catch (err) {
    console.error("Confirm error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Release payment for ConditionalVendorPayment contract
 * POST /conditionalContractRelease/:address
 */
router.post("/conditionalContractRelease/:address", async (req, res) => {
  try {
    const { address } = req.params;

    const contract = new ethers.Contract(address, contractABI1, wallet);
    const tx = await contract.releasePayment(); // triggers releasePayment()
    await tx.wait();

    // Update DB to mark as paid
    await Contract.updateOne({ address }, { paid: true });

    res.json({ message: "Payment released" });
  } catch (err) {
    console.error("Release error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Deploy VendorPayment contract (time-based)
 * POST /deploy/timedContract
 */
router.post("/deploy/timedContract", async (req, res) => {
  try {
    const { payee, amount, dueDate } = req.body;

    const factory = new ethers.ContractFactory(contractABI2, bytecode2, wallet);
    const contract = await factory.deploy(
      payee,
      ethers.parseEther(amount),
      dueDate,
      { value: ethers.parseEther(amount) }
    );
    await contract.waitForDeployment();

    // Save to MongoDB
    await Contract.create({
      type: "Timed",
      address: contract.target,
      payer: wallet.address,
      payee,
      amount,
      dueDate,
      paid: false
    });

    res.json({ contractAddress: contract.target });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Trigger payment after due date for VendorPayment contract
 * POST /timedContractTrigger/:address
 */
router.post("/timedContractTrigger/:address", async (req, res) => {
  try {
    const { address } = req.params;

    const contract = new ethers.Contract(address, contractABI2, wallet);
    const tx = await contract.triggerPayment(); // calls triggerPayment()
    await tx.wait();

    await Contract.updateOne({ address }, { paid: true });

    res.json({ message: "Payment triggered successfully" });
  } catch (err) {
    console.error("Trigger Payment:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get payment status of a VendorPayment contract
 * GET /timedContractStatus/:address
 */
router.get("/timedContractStatus/:address", async (req, res) => {
  try {
    const { address } = req.params;

    const contract = new ethers.Contract(address, contractABI2, wallet);
    const paid = await contract.paid(); // read public variable `paid`

    res.json({ address, paid });
  } catch (err) {
    console.error("Status Check:", err);
    res.status(500).json({ error: err.message });
  }
});

// Export router to be used in main app
module.exports = router;
