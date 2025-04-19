# Kunye Financial Inc. Smart Contracts Backend API
Project Overview
This project manages smart contracts for vendor payments. It includes:

Smart Contracts: For conditional vendor payments and due date-based payments.
Backend API: For deploying and interacting with the smart contracts.


Installation
git clone https://github.com/MariaSalahuddin/Kunye-Financial-Inc.-Smart-Contracts-Backend-API.git

cd project-folder

npm install



Create a .env file with the following contents:

PORT=3000

MONGO_URI=mongodb://localhost:27017/kunye_db

ALCHEMY_API=https://eth-sepolia.g.alchemy.com/v2/<YOUR_API_KEY>

PRIVATE_KEY=<YOUR_PRIVATE_KEY>



Start the backend server: node app.js


Setup Smart Contracts
1. Deploy the Smart Contracts:
Open Remix IDE: https://remix.ethereum.org

Paste the smart contract code.


VendorPayment(Timed Contract) Code:

contract VendorPayment {

    address public payer;
    address payable public payee;
    uint public amount;
    uint public dueDate;
    bool public paid;

    constructor(address payable _payee, uint _amount, uint _dueDate) {
        payer = msg.sender;
        payee = _payee;
        amount = _amount;
        dueDate = _dueDate;
        paid = false;
    }

    function triggerPayment() public {
        require(msg.sender == payer, "Only payer can release payment");
        require(!paid, "Already paid");
        require(block.timestamp >= dueDate, "Due date not reached");
        require(address(this).balance >= amount, "Insufficient funds");
        paid = true;
        payee.transfer(amount);
    }
     function getStatus() public view returns (bool) {
        return paid;
    }
    }


Conditional Payment Smart Contract Code: 

contract ConditionalVendorPayment {

    address public payer;
    address payable public payee;
    uint public amount;
    bool public confirmed;
    bool public paid;

    constructor(address payable _payee) payable {
        payer = msg.sender;
        payee = _payee;
        amount = msg.value; 
        confirmed = false;
        paid = false;
    }

    function confirmDelivery() public {
        require(msg.sender == payer, "Only payer can confirm");
        confirmed = true;
    }

    function releasePayment() public {
        require(confirmed, "Delivery not confirmed");
        require(!paid, "Already paid");
        paid = true;
        payee.transfer(amount);
    }

    function getStatus() public view returns (bool) {
        return paid;
    }
    }


Compile the contract with the correct Solidity version.

Deploy the contract on Sepolia Testnet using Injected Web3 (MetaMask).

Save the ABI and Bytecode from the Compilation Details.

2. Update ABI and Bytecode:
   
Copy the ABI and Bytecode from Remix.

Save the ABI and Bytecode files in the contracts/ directory.


Following are the APIs you can check on POSTMAN

1. Deploying Conditional Contracts
  POST: /contracts/deploy/conditionalContract
  BODY: {
  "payee": address,
  "amount": "0",
}
2. Checking Delivery Status for Conditional Contract
   GET: /contracts/conditionalContractStatus/:address
3. Confirm  Delivery for Conditional Contract
   POST: /contracts/conditionalContractConfirm/:address
4. Release Payment For Conditional Contract
   POST: /contracts/conditionalContractRelease/:address
5. Deploy Time-Based Contract
   POST: /contracts/deploy/timedContract
   BODY:{
  "payee": address,
  "amount": "0",
  "dueDate": "1744819200"
}
6. Trigger Payment for Timed Contract
   POST: /contracts/timedContractTrigger/:address
7. Check Payment Status for Timed Contract
   GET: /contracts/timedContractStatus/:address
