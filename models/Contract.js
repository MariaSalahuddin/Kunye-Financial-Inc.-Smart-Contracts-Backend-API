const mongoose = require("mongoose");

const contractSchema = new mongoose.Schema({
  type: String,
   address: String,
   payer: String,
   payee: String,
   amount: String,
   dueDate: String,
   confirmed: Boolean,
   paid: Boolean,
});

module.exports = mongoose.model("Contract", contractSchema);
