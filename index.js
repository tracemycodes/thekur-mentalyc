require('dotenv').config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require('./config/db');

const app = express();

// Connect Database
connectDB();

app.use(cors());

app.use(express.json({ extended: false }));

const server = http.createServer(app);

// Create a new instance of Socket.IO and attach it to the HTTP server
const io = new Server(server, {
  // CORS configuration for Socket.IO
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Handle socket connection event
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);
});


// Middleware to inject io into request object
app.use((req, res, next) => {
  req.io = io;
  next();
});



// Define a basic route for checking if the server is running
app.get('/', (req, res) => {
  res.send('API running');
});

// Define routes for audio-related functionality
app.use('/api/audio', require(`./routes/audio`));

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
