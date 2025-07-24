const express = require("express")
const Vehicle = require("../models/Vehicle")
const Booking = require("../models/Booking")
const auth = require("../middleware/auth")

const router = express.Router()

// Get all vehicles (for users to browse)
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      vehicleType,
      location,
      priceMin,
      priceMax,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query

    // Build query
    const query = {
      isActive: true,
      isVerified: true,
      "availability.isAvailable": true,
    }

    if (vehicleType) {
      query.vehicleType = vehicleType
    }

    if (priceMin || priceMax) {
      query["pricing.daily"] = {}
      if (priceMin) query["pricing.daily"].$gte = Number(priceMin)
      if (priceMax) query["pricing.daily"].$lte = Number(priceMax)
    }

    // Location-based search (if coordinates provided)
    if (location) {
      const [lng, lat] = location.split(",").map(Number)
      if (lng && lat) {
        query["location.coordinates"] = {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
            $maxDistance: 10000, // 10km radius
          },
        }
      }
    }

    const vehicles = await Vehicle.find(query)
      .populate("ownerId", "firstName lastName phone rating")
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Vehicle.countDocuments(query)

    res.json({
      success: true,
      data: {
        vehicles,
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error("Vehicles fetch error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch vehicles",
      error: error.message,
    })
  }
})

// Get vehicle by ID
router.get("/:vehicleId", async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.vehicleId)
      .populate("ownerId", "firstName lastName phone rating")
      .populate("reviews.userId", "firstName lastName")

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      })
    }

    res.json({
      success: true,
      data: vehicle,
    })
  } catch (error) {
    console.error("Vehicle fetch error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch vehicle",
      error: error.message,
    })
  }
})

// Add new vehicle (for renters)
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.userType !== "renter") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Renter account required.",
      })
    }

    const { vehicleType, brand, model, year, description, specifications, pricing, location, availability, images } =
      req.body

    const vehicle = new Vehicle({
      ownerId: req.user.userId,
      vehicleType,
      brand,
      model,
      year,
      description,
      specifications,
      pricing,
      location,
      availability,
      images,
    })

    await vehicle.save()

    res.status(201).json({
      success: true,
      message: "Vehicle added successfully",
      data: vehicle,
    })
  } catch (error) {
    console.error("Add vehicle error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to add vehicle",
      error: error.message,
    })
  }
})

// Update vehicle
router.put("/:vehicleId", auth, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      _id: req.params.vehicleId,
      ownerId: req.user.userId,
    })

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found or access denied",
      })
    }

    const updateFields = ["description", "specifications", "pricing", "availability", "images"]

    updateFields.forEach((field) => {
      if (req.body[field]) {
        vehicle[field] = { ...vehicle[field], ...req.body[field] }
      }
    })

    await vehicle.save()

    res.json({
      success: true,
      message: "Vehicle updated successfully",
      data: vehicle,
    })
  } catch (error) {
    console.error("Update vehicle error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update vehicle",
      error: error.message,
    })
  }
})

// Delete vehicle
router.delete("/:vehicleId", auth, async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({
      _id: req.params.vehicleId,
      ownerId: req.user.userId,
    })

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found or access denied",
      })
    }

    // Check for active bookings
    const activeBookings = await Booking.countDocuments({
      vehicleId: vehicle._id,
      status: { $in: ["confirmed", "active"] },
    })

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete vehicle with active bookings",
      })
    }

    vehicle.isActive = false
    await vehicle.save()

    res.json({
      success: true,
      message: "Vehicle deleted successfully",
    })
  } catch (error) {
    console.error("Delete vehicle error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete vehicle",
      error: error.message,
    })
  }
})

// Get owner's vehicles
router.get("/owner/vehicles", auth, async (req, res) => {
  try {
    if (req.user.userType !== "renter") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Renter account required.",
      })
    }

    const vehicles = await Vehicle.find({
      ownerId: req.user.userId,
      isActive: true,
    }).sort({ createdAt: -1 })

    res.json({
      success: true,
      data: vehicles,
    })
  } catch (error) {
    console.error("Owner vehicles fetch error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch vehicles",
      error: error.message,
    })
  }
})

// Toggle vehicle availability
router.put("/:vehicleId/availability", auth, async (req, res) => {
  try {
    const { isAvailable } = req.body

    const vehicle = await Vehicle.findOne({
      _id: req.params.vehicleId,
      ownerId: req.user.userId,
    })

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found or access denied",
      })
    }

    vehicle.availability.isAvailable = isAvailable
    await vehicle.save()

    res.json({
      success: true,
      message: `Vehicle marked as ${isAvailable ? "available" : "unavailable"}`,
      data: {
        isAvailable: vehicle.availability.isAvailable,
      },
    })
  } catch (error) {
    console.error("Toggle availability error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update availability",
      error: error.message,
    })
  }
})

module.exports = router
