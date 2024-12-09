require("dotenv").config();

require("express-async-errors");




// require("dotenv").config();
const express = require("express");
const twilio = require("twilio");

const app = express();
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
      from: process.env.TWILIO_PHONE_NUMBER,  // Your Twilio phone number
      to: phoneNumber,
    })
    .then((message) => {
      res.status(200).json({ success: "Emergency alert sent successfully!" });
    })
    .catch((error) => {
      res.status(500).json({ error: "Failed to send SMS" });
    });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});




















const EventEmitter = require("events");
EventEmitter.defaultMaxListeners = 100;

// const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const connectDB = require("./connect");
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");
const authMiddleware = require("./middleware/authentication");

// Routers
const authRouter = require("./routes/auth");
const rideRouter = require("./routes/ride");

// Import socket handler
const handleSocketConnection = require("./controllers/sockets");

// const app = express();
// app.use(express.json());

const server = http.createServer(app);

const io = socketIo(server, { cors: { origin: "*" } });

// Attach the WebSocket instance to the request object
app.use((req, res, next) => {
  req.io = io;
  return next();
});

// Initialize the WebSocket handling logic
handleSocketConnection(io);

// Routes
app.use("/auth", authRouter);
app.use("/ride", authMiddleware, rideRouter);

// Middleware
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);

    // Uncomment this and comment below one if you want to run on ip address so that you can
    // access api in physical device

    server.listen(process.env.PORT || 3000, "0.0.0.0", () =>
    // server.listen(process.env.PORT || 3000, () =>
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