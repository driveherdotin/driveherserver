// Import required packages
require("dotenv").config();
require("express-async-errors");
const express = require("express");
const twilio = require("twilio");
const http = require("http");
const socketIo = require("socket.io");
const connectDB = require("./connect");
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");
const authMiddleware = require("./middleware/authentication");
const handleSocketConnection = require("./controllers/sockets");

// Create the Express app
const app = express();

// Create the HTTP server with Express
const server = http.createServer(app);

// Create a Socket.io server instance
const io = socketIo(server, { cors: { origin: "*" } });

// Middleware to parse JSON
app.use(express.json());

// Twilio setup
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Route for sending SMS
app.post("/send-alert", (req, res) => {
  const { phoneNumber, message } = req.body;
  if (!phoneNumber || !message) {
    return res.status(400).json({ error: "Phone number and message are required" });
  }

  client.messages
    .create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER, // Your Twilio phone number
      to: phoneNumber,
    })
    .then(() => {
      res.status(200).json({ success: "Emergency alert sent successfully!" });
    })
    .catch((error) => {
      res.status(500).json({ error: "Failed to send SMS" });
    });
});

// WebSocket setup and Socket handling
app.use((req, res, next) => {
  req.io = io;
  next();
});
handleSocketConnection(io);

// Routers
const authRouter = require("./routes/auth");
const rideRouter = require("./routes/ride");
app.use("/auth", authRouter);
app.use("/ride", authMiddleware, rideRouter);

// Middleware for handling errors
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

// Start the server and connect to the database
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    // Now that the server is created, we can call `server.listen()`
    server.listen(process.env.PORT || 3000, "0.0.0.0", () =>
      console.log(`HTTP server is running on http://localhost:${process.env.PORT || 3000}`)
    );
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};
console.log(process.env.TWILIO_ACCOUNT_SID);
console.log(process.env.TWILIO_AUTH_TOKEN);
console.log(process.env.TWILIO_PHONE_NUMBER);

start();
