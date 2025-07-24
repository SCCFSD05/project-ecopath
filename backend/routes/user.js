const express = require("express")
const User = require("../models/User")
const RideRequest = require("../models/Ride Request")
const Booking = require("../models/Booking")
const auth = require("../middleware/auth")

const router = express.Router()

// Get user dashboard data
router.get("/dashboard", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Get recent rides
    const recentRides = await RideRequest.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("riderId", "vehicleDetails rating")

    // Calculate stats
    const totalRides = await RideRequest.countDocuments({
      userId: user._id,
      status: "completed",
    })

    const totalSpent = await RideRequest.aggregate([
      { $match: { userId: user._id, status: "completed" } },
      { $group: { _id: null, total: { $sum: "$actualFare" } } },
    ])

    const co2Saved = Math.round(totalRides * 2.3) // Approximate CO2 saved per ride

    res.json({
      success: true,
      data: {
        user: {
          name: user.fullName,
          email: user.email,
          walletBalance: user.walletBalance,
          rating: user.rating,
        },
        stats: {
          totalRides,
          totalSpent: totalSpent[0]?.total || 0,
          co2Saved,
          monthlyRides: await RideRequest.countDocuments({
            userId: user._id,
            status: "completed",
            createdAt: {
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          }),
        },
        recentRides,
      },
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
      error: error.message,
    })
  }
})

// Get user rides
router.get("/rides", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query

    const query = { userId: req.user.userId }
    if (status && status !== "all") {
      query.status = status
    }

    const rides = await RideRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("riderId", "vehicleDetails rating")

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

// Get favorite locations
router.get("/favorites", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("favoriteLocations")

    res.json({
      success: true,
      data: user.favoriteLocations || [],
    })
  } catch (error) {
    console.error("Favorites fetch error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch favorite locations",
      error: error.message,
    })
  }
})

// Add favorite location
router.post("/favorites", auth, async (req, res) => {
  try {
    const { name, address, coordinates } = req.body

    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Check if location already exists
    const existingFavorite = user.favoriteLocations.find((fav) => fav.name.toLowerCase() === name.toLowerCase())

    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: "Favorite location with this name already exists",
      })
    }

    user.favoriteLocations.push({
      name,
      address,
      coordinates,
    })

    await user.save()

    res.json({
      success: true,
      message: "Favorite location added successfully",
      data: user.favoriteLocations,
    })
  } catch (error) {
    console.error("Add favorite error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to add favorite location",
      error: error.message,
    })
  }
})

// Get wallet data
router.get("/wallet", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Get recent transactions (ride payments)
    const transactions = await RideRequest.find({
      userId: user._id,
      status: "completed",
      "payment.status": "paid",
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("actualFare createdAt")

    res.json({
      success: true,
      data: {
        balance: user.walletBalance,
        transactions,
      },
    })
  } catch (error) {
    console.error("Wallet fetch error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch wallet data",
      error: error.message,
    })
  }
})

// Add money to wallet
router.post("/wallet/add", auth, async (req, res) => {
  try {
    const { amount } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      })
    }

    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // In a real app, integrate with payment gateway here
    // For demo, we'll just add the amount
    user.walletBalance += amount
    await user.save()

    res.json({
      success: true,
      message: "Money added to wallet successfully",
      data: {
        newBalance: user.walletBalance,
        amountAdded: amount,
      },
    })
  } catch (error) {
    console.error("Add money error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to add money to wallet",
      error: error.message,
    })
  }
})

// Rate a completed ride
router.post("/rides/:rideId/rate", auth, async (req, res) => {
  try {
    const { rideId } = req.params
    const { rating, review } = req.body

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      })
    }

    const ride = await RideRequest.findOne({
      _id: rideId,
      userId: req.user.userId,
      status: "completed",
    })

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found or not completed",
      })
    }

    if (ride.rating.userRating.rating) {
      return res.status(400).json({
        success: false,
        message: "Ride already rated",
      })
    }

    // Update ride rating
    ride.rating.userRating = {
      rating,
      review,
      ratedAt: new Date(),
    }
    await ride.save()

    // Update rider's overall rating
    if (ride.riderId) {
      const Rider = require("../models/Rider")
      const rider = await Rider.findById(ride.riderId)
      if (rider) {
        const totalRating = rider.rating * rider.ratingCount + rating
        rider.ratingCount += 1
        rider.rating = totalRating / rider.ratingCount
        await rider.save()
      }
    }

    res.json({
      success: true,
      message: "Ride rated successfully",
    })
  } catch (error) {
    console.error("Rate ride error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to rate ride",
      error: error.message,
    })
  }
})

// Cancel a ride
router.post("/rides/:rideId/cancel", auth, async (req, res) => {
  try {
    const { rideId } = req.params
    const { reason } = req.body

    const ride = await RideRequest.findOne({
      _id: rideId,
      userId: req.user.userId,
    })

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      })
    }

    if (!ride.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: "Ride cannot be cancelled at this stage",
      })
    }

    ride.status = "cancelled"
    ride.cancellation = {
      cancelledBy: req.user.userId,
      reason,
      cancelledAt: new Date(),
    }

    await ride.save()

    // If rider was assigned, make them available again
    if (ride.riderId) {
      const Rider = require("../models/Rider")
      await Rider.findByIdAndUpdate(ride.riderId, { isAvailable: true })
    }

    res.json({
      success: true,
      message: "Ride cancelled successfully",
    })
  } catch (error) {
    console.error("Cancel ride error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to cancel ride",
      error: error.message,
    })
  }
})

module.exports = router
