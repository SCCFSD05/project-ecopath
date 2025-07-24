const express = require("express")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const User = require("../models/User")
const Rider = require("../models/Rider")
const auth = require("../middleware/auth")

const router = express.Router()

// Create new booking
router.post("/", auth, async (req, res) => {
  try {
    const { vehicleId, bookingType, startDate, endDate, pickupLocation, dropoffLocation, specialRequests } = req.body

    // Validate vehicle
    const vehicle = await Vehicle.findById(vehicleId)
    if (!vehicle || !vehicle.isActive || !vehicle.isVerified) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found or not available",
      })
    }

    // Check if vehicle is available for the requested dates
    if (!vehicle.isAvailableForDates(startDate, endDate)) {
      return res.status(400).json({
        success: false,
        message: "Vehicle is not available for the selected dates",
      })
    }

    // Check user wallet balance
    const user = await User.findById(req.user.userId)
    const booking = new Booking({
      userId: req.user.userId,
      vehicleId,
      ownerId: vehicle.ownerId,
      bookingType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      pickupLocation,
      dropoffLocation,
      specialRequests,
      pricing: {
        baseRate: vehicle.pricing[bookingType] || vehicle.pricing.daily,
        securityDeposit: vehicle.pricing.securityDeposit,
      },
    })

    const totalAmount = booking.calculateTotalAmount()

    if (user.walletBalance < totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance",
        data: {
          required: totalAmount,
          available: user.walletBalance,
        },
      })
    }

    // Create booking
    booking.timeline.push({
      status: "pending",
      timestamp: new Date(),
      note: "Booking created",
    })

    await booking.save()

    // Deduct amount from user wallet
    user.walletBalance -= totalAmount
    await user.save()

    // Update booking status to confirmed
    booking.status = "confirmed"
    booking.payment.status = "paid"
    booking.payment.paidAt = new Date()
    booking.timeline.push({
      status: "confirmed",
      timestamp: new Date(),
      note: "Payment successful, booking confirmed",
    })

    await booking.save()

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking,
    })
  } catch (error) {
    console.error("Create booking error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create booking",
      error: error.message,
    })
  }
})

// Get user bookings
router.get("/user", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query

    const query = { userId: req.user.userId }
    if (status && status !== "all") {
      query.status = status
    }

    const bookings = await Booking.find(query)
      .populate("vehicleId", "brand model vehicleType images pricing")
      .populate("ownerId", "firstName lastName phone")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Booking.countDocuments(query)

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error("User bookings fetch error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
      error: error.message,
    })
  }
})

// Get owner bookings
router.get("/owner", auth, async (req, res) => {
  try {
    if (req.user.userType !== "renter") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Renter account required.",
      })
    }

    const { page = 1, limit = 10, status } = req.query

    const query = { ownerId: req.user.userId }
    if (status && status !== "all") {
      query.status = status
    }

    const bookings = await Booking.find(query)
      .populate("vehicleId", "brand model vehicleType images")
      .populate("userId", "firstName lastName phone")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Booking.countDocuments(query)

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error("Owner bookings fetch error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
      error: error.message,
    })
  }
})

// Get booking by ID
router.get("/:bookingId", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate("vehicleId")
      .populate("userId", "firstName lastName phone")
      .populate("ownerId", "firstName lastName phone")

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      })
    }

    // Check access rights
    if (booking.userId.toString() !== req.user.userId && booking.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    res.json({
      success: true,
      data: booking,
    })
  } catch (error) {
    console.error("Booking fetch error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch booking",
      error: error.message,
    })
  }
})

// Cancel booking
router.post("/:bookingId/cancel", auth, async (req, res) => {
  try {
    const { reason } = req.body

    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      userId: req.user.userId,
    })

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      })
    }

    if (!booking.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: "Booking cannot be cancelled at this stage",
      })
    }

    const cancellationFee = booking.calculateCancellationFee()
    const refundAmount = booking.pricing.totalAmount - cancellationFee

    // Update booking
    booking.status = "cancelled"
    booking.cancellation = {
      cancelledBy: req.user.userId,
      reason,
      cancelledAt: new Date(),
      refundAmount,
      cancellationFee,
    }
    booking.timeline.push({
      status: "cancelled",
      timestamp: new Date(),
      note: `Booking cancelled by user. Refund: ₹${refundAmount}`,
    })

    await booking.save()

    // Refund to user wallet
    const user = await User.findById(req.user.userId)
    user.walletBalance += refundAmount
    await user.save()

    res.json({
      success: true,
      message: "Booking cancelled successfully",
      data: {
        refundAmount,
        cancellationFee,
      },
    })
  } catch (error) {
    console.error("Cancel booking error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to cancel booking",
      error: error.message,
    })
  }
})

// Start rental (vehicle handover)
router.post("/:bookingId/start", auth, async (req, res) => {
  try {
    const { pickupPhotos, pickupCondition, pickupOdometer, pickupFuelLevel } = req.body

    const booking = await Booking.findById(req.params.bookingId)

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      })
    }

    // Check access rights (owner or user)
    if (booking.userId.toString() !== req.user.userId && booking.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    if (booking.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Booking must be confirmed to start rental",
      })
    }

    // Update booking
    booking.status = "active"
    booking.vehicleHandover.pickupTime = new Date()
    booking.vehicleHandover.pickupPhotos = pickupPhotos
    booking.vehicleHandover.pickupCondition = pickupCondition
    booking.vehicleHandover.pickupOdometer = pickupOdometer
    booking.vehicleHandover.pickupFuelLevel = pickupFuelLevel

    booking.timeline.push({
      status: "active",
      timestamp: new Date(),
      note: "Vehicle handed over, rental started",
    })

    await booking.save()

    res.json({
      success: true,
      message: "Rental started successfully",
      data: booking,
    })
  } catch (error) {
    console.error("Start rental error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to start rental",
      error: error.message,
    })
  }
})

// End rental (vehicle return)
router.post("/:bookingId/end", auth, async (req, res) => {
  try {
    const { returnPhotos, returnCondition, returnOdometer, returnFuelLevel, damages } = req.body

    const booking = await Booking.findById(req.params.bookingId).populate("vehicleId")

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      })
    }

    // Check access rights (owner or user)
    if (booking.userId.toString() !== req.user.userId && booking.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    if (booking.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Booking must be active to end rental",
      })
    }

    // Calculate damage costs
    let totalDamageCost = 0
    if (damages && damages.length > 0) {
      totalDamageCost = damages.reduce((sum, damage) => sum + (damage.cost || 0), 0)
    }

    // Update booking
    booking.status = "completed"
    booking.vehicleHandover.returnTime = new Date()
    booking.vehicleHandover.returnPhotos = returnPhotos
    booking.vehicleHandover.returnCondition = returnCondition
    booking.vehicleHandover.returnOdometer = returnOdometer
    booking.vehicleHandover.returnFuelLevel = returnFuelLevel
    booking.vehicleHandover.damages = damages || []

    booking.timeline.push({
      status: "completed",
      timestamp: new Date(),
      note: `Rental completed. ${totalDamageCost > 0 ? `Damage cost: ₹${totalDamageCost}` : "No damages"}`,
    })

    await booking.save()

    // Update vehicle stats
    const vehicle = booking.vehicleId
    vehicle.stats.totalBookings += 1
    vehicle.stats.totalEarnings += booking.pricing.totalAmount
    const rentalDays = Math.ceil((booking.endTime - booking.startTime) / (1000 * 60 * 60 * 24))
    vehicle.stats.totalDaysRented += rentalDays
    await vehicle.save()

    // Deduct damage costs from security deposit
    if (totalDamageCost > 0) {
      const user = await User.findById(booking.userId)
      const deduction = Math.min(totalDamageCost, booking.pricing.securityDeposit)
      const refund = booking.pricing.securityDeposit - deduction

      if (refund > 0) {
        user.walletBalance += refund
        await user.save()
      }
    } else {
      // Refund full security deposit
      const user = await User.findById(booking.userId)
      user.walletBalance += booking.pricing.securityDeposit
      await user.save()
    }

    res.json({
      success: true,
      message: "Rental ended successfully",
      data: {
        booking,
        damageCost: totalDamageCost,
        securityDepositRefund: Math.max(0, booking.pricing.securityDeposit - totalDamageCost),
      },
    })
  } catch (error) {
    console.error("End rental error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to end rental",
      error: error.message,
    })
  }
})

// Rate booking
router.post("/:bookingId/rate", auth, async (req, res) => {
  try {
    const { rating, review, ratingType } = req.body // ratingType: 'user' or 'owner'

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      })
    }

    const booking = await Booking.findById(req.params.bookingId)

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      })
    }

    if (booking.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Can only rate completed bookings",
      })
    }

    // Check access and rating type
    if (ratingType === "user" && booking.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    if (ratingType === "owner" && booking.ownerId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      })
    }

    // Update rating
    if (ratingType === "user") {
      if (booking.ratings.userRating.rating) {
        return res.status(400).json({
          success: false,
          message: "Booking already rated by user",
        })
      }
      booking.ratings.userRating = {
        rating,
        review,
        ratedAt: new Date(),
      }
    } else {
      if (booking.ratings.ownerRating.rating) {
        return res.status(400).json({
          success: false,
          message: "Booking already rated by owner",
        })
      }
      booking.ratings.ownerRating = {
        rating,
        review,
        ratedAt: new Date(),
      }
    }

    await booking.save()

    // Update overall ratings
    if (ratingType === "user") {
      // Update vehicle rating
      const vehicle = await Vehicle.findById(booking.vehicleId)
      if (vehicle) {
        const totalRating = vehicle.rating * vehicle.ratingCount + rating
        vehicle.ratingCount += 1
        vehicle.rating = totalRating / vehicle.ratingCount
        vehicle.reviews.push({
          userId: booking.userId,
          rating,
          comment: review,
          bookingId: booking._id,
        })
        await vehicle.save()
      }
    } else {
      // Update user rating
      const user = await User.findById(booking.userId)
      if (user) {
        const totalRating = user.rating * user.ratingCount + rating
        user.ratingCount += 1
        user.rating = totalRating / user.ratingCount
        await user.save()
      }
    }

    res.json({
      success: true,
      message: "Rating submitted successfully",
    })
  } catch (error) {
    console.error("Rate booking error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to submit rating",
      error: error.message,
    })
  }
})

module.exports = router
