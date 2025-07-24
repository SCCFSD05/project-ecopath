const mongoose = require("mongoose")

const rideRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rider",
    },
    pickup: {
      address: {
        type: String,
        required: true,
      },
      coordinates: {
        lat: {
          type: Number,
          required: true,
        },
        lng: {
          type: Number,
          required: true,
        },
      },
      landmark: String,
      instructions: String,
    },
    destination: {
      address: {
        type: String,
        required: true,
      },
      coordinates: {
        lat: {
          type: Number,
          required: true,
        },
        lng: {
          type: Number,
          required: true,
        },
      },
      landmark: String,
      instructions: String,
    },
    vehicleType: {
      type: String,
      enum: ["cycle", "electric-vehicle"],
      required: true,
    },
    scheduledTime: {
      type: Date,
      default: Date.now,
    },
    estimatedFare: {
      type: Number,
      required: true,
    },
    actualFare: Number,
    distance: Number, // in kilometers
    duration: Number, // in minutes
    route: {
      polyline: String,
      waypoints: [
        {
          lat: Number,
          lng: Number,
          timestamp: Date,
        },
      ],
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rider-arriving", "in-progress", "completed", "cancelled"],
      default: "pending",
    },
    timeline: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        location: {
          lat: Number,
          lng: Number,
        },
        note: String,
      },
    ],
    riderLocation: {
      lat: Number,
      lng: Number,
      lastUpdated: Date,
    },
    startTime: Date,
    endTime: Date,
    payment: {
      method: {
        type: String,
        enum: ["wallet", "cash", "card", "upi"],
        default: "wallet",
      },
      status: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending",
      },
      transactionId: String,
      paidAt: Date,
    },
    rating: {
      userRating: {
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        review: String,
        ratedAt: Date,
      },
      riderRating: {
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        review: String,
        ratedAt: Date,
      },
    },
    cancellation: {
      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reason: String,
      cancelledAt: Date,
    },
    specialRequests: String,
    promoCode: String,
    discount: {
      amount: Number,
      type: String, // percentage or fixed
      code: String,
    },
    surge: {
      multiplier: {
        type: Number,
        default: 1.0,
      },
      reason: String,
    },
    communication: [
      {
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        message: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        type: {
          type: String,
          enum: ["text", "location", "call"],
          default: "text",
        },
      },
    ],
    emergencyContacts: [
      {
        name: String,
        phone: String,
        notified: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
)

// Calculate fare based on distance and vehicle type
rideRequestSchema.methods.calculateFare = function () {
  const baseRates = {
    cycle: 5, // ₹5 per km
    "electric-vehicle": 12, // ₹12 per km
  }

  const baseRate = baseRates[this.vehicleType] || 5
  const baseFare = this.distance * baseRate
  const surgeFare = baseFare * this.surge.multiplier
  const discountAmount = this.discount
    ? this.discount.type === "percentage"
      ? surgeFare * (this.discount.amount / 100)
      : this.discount.amount
    : 0

  return Math.max(surgeFare - discountAmount, baseRate) // Minimum fare = base rate
}

// Check if ride can be cancelled
rideRequestSchema.methods.canBeCancelled = function () {
  return ["pending", "accepted", "rider-arriving"].includes(this.status)
}

// Calculate estimated time of arrival
rideRequestSchema.methods.calculateETA = function () {
  if (!this.riderId || !this.riderLocation) return null

  // Simple calculation - in real app, use Google Maps API
  const distance = this.calculateDistance(
    this.riderLocation.lat,
    this.riderLocation.lng,
    this.pickup.coordinates.lat,
    this.pickup.coordinates.lng,
  )

  // Assuming average speed of 15 km/h for cycles, 25 km/h for EVs
  const avgSpeed = this.vehicleType === "cycle" ? 15 : 25
  const timeInHours = distance / avgSpeed
  const timeInMinutes = Math.ceil(timeInHours * 60)

  return timeInMinutes
}

// Calculate distance between two points (Haversine formula)
rideRequestSchema.methods.calculateDistance = function (lat1, lon1, lat2, lon2) {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = this.deg2rad(lat2 - lat1)
  const dLon = this.deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c // Distance in kilometers
  return distance
}

rideRequestSchema.methods.deg2rad = (deg) => deg * (Math.PI / 180)

module.exports = mongoose.model("RideRequest", rideRequestSchema)
