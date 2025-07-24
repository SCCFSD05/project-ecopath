const jwt = require("jsonwebtoken")
const User = require("../models/User")

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")

    // Check if user still exists
    const user = await User.findById(decoded.userId)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. User not found.",
      })
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated.",
      })
    }

    req.user = {
      userId: decoded.userId,
      userType: decoded.userType,
    }

    next()
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      })
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired.",
      })
    }

    console.error("Auth middleware error:", error)
    res.status(500).json({
      success: false,
      message: "Authentication failed.",
      error: error.message,
    })
  }
}

module.exports = auth
