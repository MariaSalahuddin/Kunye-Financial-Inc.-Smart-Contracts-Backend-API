const express = require("express");
const { ethers } = require("ethers");
const router = express.Router();
const Contract = require("../models/Contract");

const conditionalContract = require("../contracts/ConditionalPayment.json");
const bytecode1 = require("../contracts/ConditionalPayment.json");
const contractABI2 = require("../contracts/VendorPayment.json").abi;
const bytecode2 = require("../contracts/VendorPayment.json").bytecode;

const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_API);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Deploy Conditional Contract
router.post("/deploy/conditionalContract", async (req, res) => {
  try {
    const { payee, amount } = req.body;

    const factory = new ethers.ContractFactory(contractABI1, bytecode1, wallet);
    const contract = await factory.deploy(payee, {
      value: ethers.parseEther(amount)
    });

    await contract.waitForDeployment();

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

// Check  Delivery Status for Conditional Contract
router.get("/conditionalContractStatus/:address", async (req, res) => {
  try {
    const { address } = req.params;

    const contract = new ethers.Contract(address, contractABI1, wallet);

    const paid = await contract.getStatus();
    res.json({ address, paid });
  } catch (err) {
    console.error("Status error:", err);
    res.status(500).json({ error: err.message });
  }
});
//  Confirm  Delivery for Conditional Contract
router.post("/conditionalContractConfirm/:address", async (req, res) => {
  try {
    const { address } = req.params;

    const contract = new ethers.Contract(address, contractABI1, wallet);
    const tx = await contract.confirmDelivery();
    await tx.wait();

    await Contract.updateOne({ address }, { confirmed: true });

    res.json({ message: "Delivery confirmed" });
  } catch (err) {
    console.error("Confirm error:", err);
    res.status(500).json({ error: err.message });
  }
});
// Release Payment For Conditional Contract
router.post("/conditionalContractRelease/:address", async (req, res) => {
  try {
    const { address } = req.params;

    const contract = new ethers.Contract(address, contractABI1, wallet);
    const tx = await contract.releasePayment();
    await tx.wait();

    await Contract.updateOne({ address }, { paid: true });

    res.json({ message: "Payment released" });
  } catch (err) {
    console.error("Release error:", err);
    res.status(500).json({ error: err.message });
  }
});


// Deploy Time-Based Contract
router.post("/deploy/timedContract", async (req, res) => {
  try {
    const { payee, amount, dueDate } = req.body;
    const factory = new ethers.ContractFactory(contractABI2, bytecode2, wallet);
    const contract = await factory.deploy(payee, ethers.parseEther(amount), dueDate, {
      value: ethers.parseEther(amount)
    });
    await contract.waitForDeployment();

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

//Trigger Payment for Timed Contract
router.post("/timedContractTrigger/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const contract = new ethers.Contract(address, contractABI2, wallet);

    const tx = await contract.triggerPayment();
    await tx.wait();

    await Contract.updateOne({ address }, { paid: true });

    res.json({ message: "Payment triggered successfully" });
  } catch (err) {
    console.error("Trigger Payment:", err);
    res.status(500).json({ error: err.message });
  }
});

//Check Payment Status for Timed Contract
router.get("/timedContractStatus/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const contract = new ethers.Contract(address, contractABI2, wallet);

    const paid = await contract.paid();
    res.json({ address, paid });
  } catch (err) {
    console.error("Status Check:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
