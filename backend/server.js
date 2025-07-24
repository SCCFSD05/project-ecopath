const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const path = require("path")
const http = require("http")
const socketIo = require("socket.io")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
require("dotenv").config()

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
})

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static("public"))

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/ecopath", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

const db = mongoose.connection
db.on("error", console.error.bind(console, "MongoDB connection error:"))
db.once("open", () => {
  console.log("Connected to MongoDB")
})

// Models
const User = require("./models/User")
const Rider = require("./models/Rider")
const Vehicle = require("./models/Vehicle")
const Booking = require("./models/Booking")
const RideRequest = require("./models/Ride Request")

// Routes
const authRoutes = require("./routes/auth")
const userRoutes = require("./routes/user")
const riderRoutes = require("./routes/rider")
const vehicleRoutes = require("./routes/vehicle")
const bookingRoutes = require("./routes/booking")

app.use("/api/auth", authRoutes)
app.use("/api/user", userRoutes)
app.use("/api/rider", riderRoutes)
app.use("/api/vehicle", vehicleRoutes)
app.use("/api/booking", bookingRoutes)

// Socket.IO for real-time notifications
io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  // Join rider to their room for receiving ride requests
  socket.on("join-rider", (riderId) => {
    socket.join(`rider-${riderId}`)
    console.log(`Rider ${riderId} joined their room`)
  })

  // Join user to their room for ride updates
  socket.on("join-user", (userId) => {
    socket.join(`user-${userId}`)
    console.log(`User ${userId} joined their room`)
  })

  // Handle ride request from user
  socket.on("ride-request", async (data) => {
    try {
      const { userId, pickup, destination, vehicleType } = data

      // Find nearby available riders
      const availableRiders = await Rider.find({
        isOnline: true,
        vehicleType: vehicleType,
        isAvailable: true,
      }).limit(5)

      // Create ride request
      const rideRequest = new RideRequest({
        userId,
        pickup,
        destination,
        vehicleType,
        status: "pending",
      })
      await rideRequest.save()

      // Send ride request to available riders
      availableRiders.forEach((rider) => {
        io.to(`rider-${rider._id}`).emit("new-ride-request", {
          requestId: rideRequest._id,
          pickup,
          destination,
          vehicleType,
          estimatedFare: calculateFare(pickup, destination),
          userId,
        })
      })

      socket.emit("ride-request-sent", { requestId: rideRequest._id })
    } catch (error) {
      socket.emit("error", { message: "Failed to send ride request" })
    }
  })

  // Handle ride acceptance by rider
  socket.on("accept-ride", async (data) => {
    try {
      const { requestId, riderId } = data

      const rideRequest = await RideRequest.findById(requestId)
      if (rideRequest && rideRequest.status === "pending") {
        rideRequest.riderId = riderId
        rideRequest.status = "accepted"
        await rideRequest.save()

        // Update rider availability
        await Rider.findByIdAndUpdate(riderId, { isAvailable: false })

        // Notify user that ride was accepted
        io.to(`user-${rideRequest.userId}`).emit("ride-accepted", {
          requestId,
          riderId,
          message: "Your ride has been accepted!",
        })

        // Notify other riders that ride is no longer available
        const otherRiders = await Rider.find({
          _id: { $ne: riderId },
          isOnline: true,
        })

        otherRiders.forEach((rider) => {
          io.to(`rider-${rider._id}`).emit("ride-taken", { requestId })
        })
      }
    } catch (error) {
      socket.emit("error", { message: "Failed to accept ride" })
    }
  })

  // Handle ride completion
  socket.on("complete-ride", async (data) => {
    try {
      const { requestId, riderId } = data

      await RideRequest.findByIdAndUpdate(requestId, { status: "completed" })
      await Rider.findByIdAndUpdate(riderId, { isAvailable: true })

      const rideRequest = await RideRequest.findById(requestId)
      io.to(`user-${rideRequest.userId}`).emit("ride-completed", {
        requestId,
        message: "Your ride has been completed!",
      })
    } catch (error) {
      socket.emit("error", { message: "Failed to complete ride" })
    }
  })

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)
  })
})

// Helper function to calculate fare
function calculateFare(pickup, destination) {
  // Simple fare calculation - in real app, use Google Maps API
  const baseRate = 5 // ₹5 per km for cycles
  const estimatedDistance = Math.random() * 10 + 2 // Random distance 2-12 km
  return Math.round(baseRate * estimatedDistance)
}

// Placeholder SVG generator route
app.get("/placeholder.svg", (req, res) => {
  const width = req.query.width || 300
  const height = req.query.height || 200
  const query = req.query.query || `${width}×${height}`
  const bgColor = req.query.bg || "#e2e8f0"
  const textColor = req.query.color || "#64748b"

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${bgColor}"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" 
            fill="${textColor}" text-anchor="middle" dy=".3em">
        ${query}
      </text>
    </svg>
  `

  res.setHeader("Content-Type", "image/svg+xml")
  res.send(svg)
})

// Serve static files
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

app.get("/auth.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "auth.html"))
})

app.get("/user.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "user.html"))
})

app.get("/rider.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "rider.html"))
})

app.get("/renting.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "renting.html"))
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

module.exports = { app, io }
