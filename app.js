// Load environment variables from .env file
require("dotenv").config();

// Import necessary modules
const express = require("express");
const mongoose = require("mongoose");
const contractRoutes = require("./routes/contracts");

// Initialize Express application
const app = express();

// Middleware to parse incoming JSON requests
app.use(express.json());

// Mount routes for handling smart contract APIs
app.use("/contracts", contractRoutes);

/**
 * Function to start the server
 * - Connects to MongoDB using credentials from .env
 * - Starts Express server on defined PORT
 */
const startServer = async () => {
  try {
    // Connect to MongoDB using Mongoose
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true    
    });
    console.log("MongoDB connected.");

    // Start the server after DB connection is successful
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  } catch (error) {
    // Log and exit if DB connection fails
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1); // Exit process with failure status
  }
};

// Invoke the server start function
startServer();
