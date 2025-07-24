const mongoose = require("mongoose")

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookingType: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    duration: {
      days: Number,
      hours: Number,
    },
    pickupLocation: {
      address: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
      instructions: String,
    },
    dropoffLocation: {
      address: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
      instructions: String,
    },
    pricing: {
      baseRate: Number,
      totalDays: Number,
      subtotal: Number,
      securityDeposit: Number,
      taxes: Number,
      discount: Number,
      totalAmount: Number,
    },
    payment: {
      method: {
        type: String,
        enum: ["wallet", "card", "upi", "cash"],
        default: "wallet",
      },
      status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
      },
      transactionId: String,
      paidAt: Date,
      refundAmount: Number,
      refundedAt: Date,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "active", "completed", "cancelled"],
      default: "pending",
    },
    timeline: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: String,
      },
    ],
    vehicleHandover: {
      pickupTime: Date,
      pickupPhotos: [String],
      pickupCondition: String,
      pickupOdometer: Number,
      pickupFuelLevel: Number, // For electric vehicles
      returnTime: Date,
      returnPhotos: [String],
      returnCondition: String,
      returnOdometer: Number,
      returnFuelLevel: Number,
      damages: [
        {
          description: String,
          photos: [String],
          cost: Number,
        },
      ],
    },
    ratings: {
      userRating: {
        rating: Number,
        review: String,
        ratedAt: Date,
      },
      ownerRating: {
        rating: Number,
        review: String,
        ratedAt: Date,
      },
    },
    communication: [
      {
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        to: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        message: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        isRead: {
          type: Boolean,
          default: false,
        },
      },
    ],
    cancellation: {
      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reason: String,
      cancelledAt: Date,
      refundAmount: Number,
      cancellationFee: Number,
    },
    specialRequests: String,
    notes: String,
  },
  {
    timestamps: true,
  },
)

// Calculate total booking amount
bookingSchema.methods.calculateTotalAmount = function () {
  const days = Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24))
  const subtotal = this.pricing.baseRate * days
  const taxes = subtotal * 0.18 // 18% GST
  const totalAmount = subtotal + taxes + this.pricing.securityDeposit - (this.pricing.discount || 0)

  this.pricing.totalDays = days
  this.pricing.subtotal = subtotal
  this.pricing.taxes = taxes
  this.pricing.totalAmount = totalAmount

  return totalAmount
}

// Check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function () {
  const now = new Date()
  const hoursUntilStart = (this.startDate - now) / (1000 * 60 * 60)

  // Can cancel if more than 24 hours before start
  return hoursUntilStart > 24 && this.status === "confirmed"
}

// Calculate cancellation fee
bookingSchema.methods.calculateCancellationFee = function () {
  const now = new Date()
  const hoursUntilStart = (this.startDate - now) / (1000 * 60 * 60)

  if (hoursUntilStart > 48) return 0 // No fee if cancelled 48+ hours before
  if (hoursUntilStart > 24) return this.pricing.totalAmount * 0.1 // 10% fee
  if (hoursUntilStart > 12) return this.pricing.totalAmount * 0.25 // 25% fee
  return this.pricing.totalAmount * 0.5 // 50% fee if less than 12 hours
}

module.exports = mongoose.model("Booking", bookingSchema)
