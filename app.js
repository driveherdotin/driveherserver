require("dotenv").config();
require("express-async-errors");

const EventEmitter = require("events");
EventEmitter.defaultMaxListeners = 100;

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const connectDB = require("./connect");
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");
const authMiddleware = require("./middleware/authentication");
const twilio = require("twilio");  // Import Twilio

// Routers
const authRouter = require("./routes/auth");
const rideRouter = require("./routes/ride");

// Import socket handler
const handleSocketConnection = require("./controllers/sockets");

const app = express();
app.use(express.json());

const server = http.createServer(app);

const io = socketIo(server, { cors: { origin: "*" } });

// Attach the WebSocket instance to the request object
app.use((req, res, next) => {
  req.io = io;
  return next();
});

// Initialize the WebSocket handling logic
handleSocketConnection(io);

// Twilio setup for sending SMS
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Predefined receiver phone number (replace with your own dummy number)
const predefinedPhoneNumber = "+916202831780";  // This is the number the alert will be sent to

const sendAlert = (message) => {
  return client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,  // Your Twilio phone number
    to: predefinedPhoneNumber,  // Send alert to the predefined phone number
  });
};

// Emergency Alert Route
app.post("/send-alert", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    await sendAlert(message);  // Send SMS with the provided message
    return res.status(200).json({ success: "Emergency alert sent successfully bro!" });
  } catch (error) {
    console.error("Failed to send SMS", error);
    return res.status(500).json({ error: "Failed to send SMS" });
  }
});

// Routes
app.use("/auth", authRouter);
app.use("/ride", authMiddleware, rideRouter);

// Middleware
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);

    server.listen(process.env.PORT || 3000, "0.0.0.0", () =>
      console.log(
        `HTTP server is running on port http://localhost:${
          process.env.PORT || 3000
        }`
      )
    );
  } catch (error) {
    console.log(error);
  }
};

start();
