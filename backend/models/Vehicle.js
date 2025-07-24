const mongoose = require("mongoose")

const vehicleSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vehicleType: {
      type: String,
      enum: ["cycle", "electric-vehicle"],
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
      min: 2015,
      max: new Date().getFullYear() + 1,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    images: [
      {
        url: String,
        caption: String,
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],
    specifications: {
      color: String,
      features: [String],
      condition: {
        type: String,
        enum: ["excellent", "good", "fair"],
        default: "good",
      },
      batteryCapacity: String, // For electric vehicles
      range: String, // For electric vehicles
      chargingTime: String, // For electric vehicles
      gearCount: Number, // For cycles
      frameSize: String, // For cycles
      weight: Number,
    },
    pricing: {
      daily: {
        type: Number,
        required: true,
        min: 10,
      },
      weekly: Number,
      monthly: Number,
      securityDeposit: {
        type: Number,
        required: true,
        min: 100,
      },
    },
    location: {
      address: {
        type: String,
        required: true,
      },
      coordinates: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number],
          required: true,
        },
      },
      landmark: String,
      instructions: String,
    },
    availability: {
      isAvailable: {
        type: Boolean,
        default: true,
      },
      availableFrom: Date,
      availableUntil: Date,
      unavailableDates: [Date],
      workingHours: {
        start: {
          type: String,
          default: "06:00",
        },
        end: {
          type: String,
          default: "22:00",
        },
      },
    },
    documents: {
      registration: {
        url: String,
        verified: {
          type: Boolean,
          default: false,
        },
      },
      insurance: {
        url: String,
        expiryDate: Date,
        verified: {
          type: Boolean,
          default: false,
        },
      },
      pollution: {
        url: String,
        expiryDate: Date,
        verified: {
          type: Boolean,
          default: false,
        },
      },
    },
    stats: {
      totalBookings: {
        type: Number,
        default: 0,
      },
      totalEarnings: {
        type: Number,
        default: 0,
      },
      totalDaysRented: {
        type: Number,
        default: 0,
      },
      utilizationRate: {
        type: Number,
        default: 0,
      },
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 1,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    reviews: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        rating: Number,
        comment: String,
        bookingId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Booking",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    maintenance: {
      lastServiceDate: Date,
      nextServiceDate: Date,
      serviceHistory: [
        {
          date: Date,
          type: String,
          description: String,
          cost: Number,
          serviceProvider: String,
        },
      ],
      issues: [
        {
          description: String,
          reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          reportedAt: {
            type: Date,
            default: Date.now,
          },
          status: {
            type: String,
            enum: ["open", "in-progress", "resolved"],
            default: "open",
          },
          resolvedAt: Date,
        },
      ],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationDate: Date,
    rejectionReason: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

// Create geospatial index for location-based queries
vehicleSchema.index({ "location.coordinates": "2dsphere" })

// Calculate utilization rate
vehicleSchema.methods.calculateUtilizationRate = function () {
  const daysSinceCreated = Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24))
  if (daysSinceCreated === 0) return 0

  return Math.round((this.stats.totalDaysRented / daysSinceCreated) * 100)
}

// Check if vehicle is available for given dates
vehicleSchema.methods.isAvailableForDates = function (startDate, endDate) {
  if (!this.availability.isAvailable) return false

  const start = new Date(startDate)
  const end = new Date(endDate)

  // Check if dates fall within available period
  if (this.availability.availableFrom && start < this.availability.availableFrom) return false
  if (this.availability.availableUntil && end > this.availability.availableUntil) return false

  // Check for unavailable dates
  for (const unavailableDate of this.availability.unavailableDates) {
    if (start <= unavailableDate && end >= unavailableDate) return false
  }

  return true
}

module.exports = mongoose.model("Vehicle", vehicleSchema)
