require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const contractRoutes = require("./routes/contracts");

const app = express();
app.use(express.json());
app.use("/contracts", contractRoutes);

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("MongoDB connected.");

    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1); // Exit process with failure
  }
};

startServer();
