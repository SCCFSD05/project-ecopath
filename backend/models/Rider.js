const mongoose = require("mongoose")

const riderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
    },
    vehicleType: {
      type: String,
      enum: ["cycle", "electric-vehicle", "both"],
      required: true,
    },
    vehicleDetails: {
      brand: String,
      model: String,
      registrationNumber: String,
      color: String,
      year: Number,
      features: [String],
    },
    documents: {
      license: {
        url: String,
        verified: { type: Boolean, default: false },
      },
      aadhar: {
        url: String,
        verified: { type: Boolean, default: false },
      },
      vehicleRC: {
        url: String,
        verified: { type: Boolean, default: false },
      },
    },
    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
      address: String,
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
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
    serviceArea: {
      radius: {
        type: Number,
        default: 10, // km
      },
      zones: [String],
    },
    stats: {
      totalRides: {
        type: Number,
        default: 0,
      },
      totalEarnings: {
        type: Number,
        default: 0,
      },
      todayRides: {
        type: Number,
        default: 0,
      },
      todayEarnings: {
        type: Number,
        default: 0,
      },
      weeklyRides: {
        type: Number,
        default: 0,
      },
      weeklyEarnings: {
        type: Number,
        default: 0,
      },
      monthlyRides: {
        type: Number,
        default: 0,
      },
      monthlyEarnings: {
        type: Number,
        default: 0,
      },
      onlineHours: {
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
        rideId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "RideRequest",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      accountHolderName: String,
      bankName: String,
      verified: {
        type: Boolean,
        default: false,
      },
    },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    approvalDate: Date,
    rejectionReason: String,
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Create geospatial index for location-based queries
riderSchema.index({ currentLocation: "2dsphere" })

// Update last active time
riderSchema.methods.updateLastActive = function () {
  this.lastActiveAt = new Date()
  return this.save()
}

// Calculate average rating
riderSchema.methods.calculateAverageRating = function () {
  if (this.ratingCount === 0) return 5.0
  return this.rating
}

// Check if rider is within service hours
riderSchema.methods.isWithinServiceHours = function () {
  const now = new Date()
  const currentTime = now.getHours() * 100 + now.getMinutes()
  const startTime = Number.parseInt(this.workingHours.start.replace(":", ""))
  const endTime = Number.parseInt(this.workingHours.end.replace(":", ""))

  return currentTime >= startTime && currentTime <= endTime
}

module.exports = mongoose.model("Rider", riderSchema)
