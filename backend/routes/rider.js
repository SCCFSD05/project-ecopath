const express = require("express")
const Rider = require("../models/Rider")
const RideRequest = require("../models/Ride Request")
const User = require("../models/User")
const auth = require("../middleware/auth")

const router = express.Router()

// Get rider dashboard data
router.get("/dashboard", auth, async (req, res) => {
  try {
    if (req.user.userType !== "rider") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Rider account required.",
      })
    }

    const rider = await Rider.findOne({ userId: req.user.userId }).populate("userId", "firstName lastName email phone")

    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider profile not found",
      })
    }

    // Get recent rides
    const recentRides = await RideRequest.find({ riderId: rider._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("userId", "firstName lastName")

    // Calculate today's stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayRides = await RideRequest.countDocuments({
      riderId: rider._id,
      status: "completed",
      createdAt: { $gte: today },
    })

    const todayEarnings = await RideRequest.aggregate([
      {
        $match: {
          riderId: rider._id,
          status: "completed",
          createdAt: { $gte: today },
        },
      },
      { $group: { _id: null, total: { $sum: "$actualFare" } } },
    ])

    res.json({
      success: true,
      data: {
        rider,
        stats: {
          totalRides: rider.stats.totalRides,
          totalEarnings: rider.stats.totalEarnings,
          todayRides,
          todayEarnings: todayEarnings[0]?.total || 0,
          rating: rider.rating,
          isOnline: rider.isOnline,
          isAvailable: rider.isAvailable,
        },
        recentRides,
      },
    })
  } catch (error) {
    console.error("Rider dashboard error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
      error: error.message,
    })
  }
})

// Update rider online status
router.put("/status", auth, async (req, res) => {
  try {
    const { isOnline, location } = req.body

    const rider = await Rider.findOne({ userId: req.user.userId })
    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider profile not found",
      })
    }

    rider.isOnline = isOnline
    if (location) {
      rider.currentLocation = {
        type: "Point",
        coordinates: [location.lng, location.lat],
        address: location.address,
        lastUpdated: new Date(),
      }
    }

    if (!isOnline) {
      rider.isAvailable = false
    } else {
      rider.isAvailable = true
    }

    await rider.save()

    res.json({
      success: true,
      message: `Rider is now ${isOnline ? "online" : "offline"}`,
      data: {
        isOnline: rider.isOnline,
        isAvailable: rider.isAvailable,
      },
    })
  } catch (error) {
    console.error("Status update error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update status",
      error: error.message,
    })
  }
})

// Update rider location
router.put("/location", auth, async (req, res) => {
  try {
    const { lat, lng, address } = req.body

    const rider = await Rider.findOne({ userId: req.user.userId })
    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider profile not found",
      })
    }

    rider.currentLocation = {
      type: "Point",
      coordinates: [lng, lat],
      address,
      lastUpdated: new Date(),
    }

    await rider.save()

    res.json({
      success: true,
      message: "Location updated successfully",
    })
  } catch (error) {
    console.error("Location update error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update location",
      error: error.message,
    })
  }
})

// Get rider rides
router.get("/rides", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query

    const rider = await Rider.findOne({ userId: req.user.userId })
    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider profile not found",
      })
    }

    const query = { riderId: rider._id }
    if (status && status !== "all") {
      query.status = status
    }

    const rides = await RideRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("userId", "firstName lastName phone")

    const total = await RideRequest.countDocuments(query)

    res.json({
      success: true,
      data: {
        rides,
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error("Rides fetch error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch rides",
      error: error.message,
    })
  }
})

// Accept a ride request
router.post("/rides/:rideId/accept", auth, async (req, res) => {
  try {
    const { rideId } = req.params

    const rider = await Rider.findOne({ userId: req.user.userId })
    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider profile not found",
      })
    }

    if (!rider.isOnline || !rider.isAvailable) {
      return res.status(400).json({
        success: false,
        message: "Rider must be online and available to accept rides",
      })
    }

    const ride = await RideRequest.findById(rideId)
    if (!ride || ride.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Ride request not available",
      })
    }

    // Accept the ride
    ride.riderId = rider._id
    ride.status = "accepted"
    ride.timeline.push({
      status: "accepted",
      timestamp: new Date(),
      note: "Ride accepted by rider",
    })

    await ride.save()

    // Update rider availability
    rider.isAvailable = false
    await rider.save()

    res.json({
      success: true,
      message: "Ride accepted successfully",
      data: ride,
    })
  } catch (error) {
    console.error("Accept ride error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to accept ride",
      error: error.message,
    })
  }
})

// Start a ride
router.post("/rides/:rideId/start", auth, async (req, res) => {
  try {
    const { rideId } = req.params

    const rider = await Rider.findOne({ userId: req.user.userId })
    const ride = await RideRequest.findOne({
      _id: rideId,
      riderId: rider._id,
      status: "accepted",
    })

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found or cannot be started",
      })
    }

    ride.status = "in-progress"
    ride.startTime = new Date()
    ride.timeline.push({
      status: "in-progress",
      timestamp: new Date(),
      note: "Ride started",
    })

    await ride.save()

    res.json({
      success: true,
      message: "Ride started successfully",
      data: ride,
    })
  } catch (error) {
    console.error("Start ride error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to start ride",
      error: error.message,
    })
  }
})

// Complete a ride
router.post("/rides/:rideId/complete", auth, async (req, res) => {
  try {
    const { rideId } = req.params
    const { actualFare, distance, duration } = req.body

    const rider = await Rider.findOne({ userId: req.user.userId })
    const ride = await RideRequest.findOne({
      _id: rideId,
      riderId: rider._id,
      status: "in-progress",
    })

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found or cannot be completed",
      })
    }

    // Complete the ride
    ride.status = "completed"
    ride.endTime = new Date()
    ride.actualFare = actualFare || ride.estimatedFare
    ride.distance = distance
    ride.duration = duration
    ride.payment.status = "paid" // In real app, process payment here
    ride.payment.paidAt = new Date()
    ride.timeline.push({
      status: "completed",
      timestamp: new Date(),
      note: "Ride completed",
    })

    await ride.save()

    // Update rider stats
    rider.stats.totalRides += 1
    rider.stats.totalEarnings += ride.actualFare
    rider.stats.todayRides += 1
    rider.stats.todayEarnings += ride.actualFare
    rider.isAvailable = true // Make rider available for new rides

    await rider.save()

    // Update user stats
    const user = await User.findById(ride.userId)
    if (user) {
      user.totalRides += 1
      user.totalSpent += ride.actualFare
      user.walletBalance -= ride.actualFare // Deduct from wallet
      await user.save()
    }

    res.json({
      success: true,
      message: "Ride completed successfully",
      data: ride,
    })
  } catch (error) {
    console.error("Complete ride error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to complete ride",
      error: error.message,
    })
  }
})

// Get rider earnings
router.get("/earnings", auth, async (req, res) => {
  try {
    const { period = "all" } = req.query

    const rider = await Rider.findOne({ userId: req.user.userId })
    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider profile not found",
      })
    }

    let dateFilter = {}
    const now = new Date()

    switch (period) {
      case "today":
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        dateFilter = { createdAt: { $gte: today } }
        break
      case "week":
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
        weekStart.setHours(0, 0, 0, 0)
        dateFilter = { createdAt: { $gte: weekStart } }
        break
      case "month":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        dateFilter = { createdAt: { $gte: monthStart } }
        break
    }

    const earnings = await RideRequest.aggregate([
      {
        $match: {
          riderId: rider._id,
          status: "completed",
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: "$actualFare" },
          totalRides: { $sum: 1 },
          avgFare: { $avg: "$actualFare" },
        },
      },
    ])

    const result = earnings[0] || {
      totalEarnings: 0,
      totalRides: 0,
      avgFare: 0,
    }

    res.json({
      success: true,
      data: {
        period,
        ...result,
        availableBalance: rider.stats.totalEarnings * 0.8, // 80% available, 20% held
      },
    })
  } catch (error) {
    console.error("Earnings fetch error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch earnings",
      error: error.message,
    })
  }
})

// Update rider profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { vehicleDetails, workingHours, serviceArea, emergencyContact, bankDetails } = req.body

    const rider = await Rider.findOne({ userId: req.user.userId })
    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider profile not found",
      })
    }

    // Update rider fields
    if (vehicleDetails) rider.vehicleDetails = { ...rider.vehicleDetails, ...vehicleDetails }
    if (workingHours) rider.workingHours = workingHours
    if (serviceArea) rider.serviceArea = { ...rider.serviceArea, ...serviceArea }
    if (emergencyContact) rider.emergencyContact = emergencyContact
    if (bankDetails) rider.bankDetails = { ...rider.bankDetails, ...bankDetails }

    await rider.save()

    res.json({
      success: true,
      message: "Rider profile updated successfully",
      data: rider,
    })
  } catch (error) {
    console.error("Rider profile update error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update rider profile",
      error: error.message,
    })
  }
})

module.exports = router
