const visitorService = require("../services/visitorService");

// Middleware for tracking visitor data
async function visitorTracking(req, res, next) {
  try {
    // Get client IP address
    const clientIp =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const cookieVisitorId = req.cookies["visitor_id"];
    let visitorId;
    let isNewSession = false;

    // Check if visitor has a cookie already
    if (!cookieVisitorId) {
      // New visitor without cookie
      visitorId = `${clientIp}-${new Date().getTime()}`;

      // Set visitor cookie
      res.cookie("visitor_id", visitorId, {
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        httpOnly: true, // More secure
        sameSite: "strict", // CSRF protection
      });

      // This is a new session
      isNewSession = true;
    } else {
      // Existing visitor with cookie
      visitorId = cookieVisitorId;
    }

    // Track the visitor
    await visitorService.trackVisitor(visitorId, clientIp);
  } catch (error) {
    // Log error but don't stop the request
    console.error("Error in visitor tracking:", error);
  }

  // Always proceed to next middleware, even if there's an error
  next();
}

module.exports = visitorTracking;
