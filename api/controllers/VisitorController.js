const visitorService = require("../services/visitorService");
const VisitorModel = require("../models/visitor");

// Handler for returning monthly visitor statistics
async function getMonthlyVisitors(req, res) {
  try {
    const visitorData = await visitorService.readVisitorData();
    const currentMonthKey = visitorService.getCurrentMonthKey();

    const response = {
      current_month: currentMonthKey,
      visitor_count: visitorData[currentMonthKey]
        ? {
            total_visitors: visitorData[currentMonthKey].total_visitors,
            unique_visitors:
              visitorData[currentMonthKey].unique_visitors.length,
            active_sessions: visitorService.calculateActiveSessions(
              visitorData[currentMonthKey]
            ),
          }
        : { total_visitors: 0, unique_visitors: 0, active_sessions: 0 },
    };

    res.json(response);
  } catch (error) {
    console.error("Error getting monthly visitors:", error);
    res.status(500).json({ error: "Failed to retrieve visitor data" });
  }
}

async function getMonthlyVisitorDetails(req, res) {
  try {
    // Extract and validate query parameters with defaults
    const {
      month,
      startMonth,
      endMonth,
      limit = 3,
      sort = "asc",
      reverseOrder = false,
      admin = false,
    } = req.query;

    const parsedLimit = parseInt(limit) || 3;
    const shouldReverseOrder = reverseOrder === "true";
    const isAdminView = admin === "true";

    // Get visitor data based on provided filters
    let visitorData;

    if (month) {
      // Get specific month
      visitorData = await visitorService.readVisitorData();
      if (!visitorData[month]) {
        return res.status(404).json({ error: "Month not found" });
      }
      visitorData = { [month]: visitorData[month] };
    } else if (startMonth && endMonth) {
      // Filter data by specific month range
      visitorData = await visitorService.getVisitorDataInRange(
        startMonth,
        endMonth
      );
    } else {
      // Get all months
      visitorData = await visitorService.getAllMonthsData();
    }

    // Get all month keys
    let monthKeys = Object.keys(visitorData);

    // First sort the months by chronological order
    let chronologicalMonths = monthKeys.sort((a, b) => a.localeCompare(b));

    // Select which months to include based on newest/oldest criteria
    let monthsToDisplay;
    if (sort === "desc") {
      // For desc, we want newest months first (take from the end of chronological list)
      monthsToDisplay = chronologicalMonths.slice(-parsedLimit).reverse();
    } else {
      // For asc, we want oldest months first (take from the beginning of chronological list)
      monthsToDisplay = chronologicalMonths.slice(0, parsedLimit);
    }

    // Determine final display order
    if (shouldReverseOrder) {
      // Reverse the display order, but keep the same months
      monthsToDisplay = [...monthsToDisplay].reverse();
    }

    // Process and clean up the data
    const cleanData = {};

    // Construct the result object in the order specified
    for (const month of monthsToDisplay) {
      cleanData[month] = processMonthData(visitorData[month], isAdminView);
    }

    // For debugging
    console.log("Selected months in order:", monthsToDisplay);

    res.json(cleanData);
  } catch (error) {
    console.error("Error getting visitor details:", error);
    res.status(500).json({ error: "Failed to retrieve visitor details" });
  }
}

/**
 * Process a single month's data
 * @param {Object} monthData - Raw month data
 * @param {Boolean} isAdminView - Whether to include admin-only data
 * @returns {Object} Processed month data
 */
function processMonthData(monthData, isAdminView) {
  // Convert to plain object if it's a Mongoose document
  const dataObject = monthData.toObject ? monthData.toObject() : monthData;

  // Build the cleaned data object
  const cleanedMonthData = {
    ...dataObject,
    unique_count: dataObject.unique_visitors?.length || 0,
    active_sessions_count: visitorService.calculateActiveSessions(monthData),
  };

  // Handle visitor sessions based on admin access
  if (isAdminView && dataObject.visitor_sessions) {
    cleanedMonthData.visitor_sessions_readable = sanitizeVisitorSessions(
      dataObject.visitor_sessions
    );
  } else {
    // Remove raw session data for non-admin view
    delete cleanedMonthData.visitor_sessions;
  }

  return cleanedMonthData;
}

/**
 * Sanitize visitor session data
 * @param {Map|Object} visitorSessions - Visitor session data
 * @returns {Object} Sanitized visitor sessions
 */
function sanitizeVisitorSessions(visitorSessions) {
  const sanitizedSessions = {};

  // Handle both Map and plain object formats
  const entries =
    visitorSessions instanceof Map
      ? visitorSessions.entries()
      : Object.entries(visitorSessions);

  for (const [visitorId, timestamp] of entries) {
    const sanitizedKey = visitorId.replace(/\./g, "_"); // Replace '.' with '_'

    // Handle MongoDB NumberLong format if present
    let timeValue = timestamp;
    if (timestamp && typeof timestamp === "object" && timestamp.$numberLong) {
      timeValue = Number(timestamp.$numberLong);
    }

    sanitizedSessions[sanitizedKey] = new Date(timeValue).toISOString();
  }

  return sanitizedSessions;
}

// Get visitor data retention statistics
async function getVisitorDataStats(req, res) {
  try {
    const stats = await visitorService.getDataRetentionStats();
    res.json(stats);
  } catch (error) {
    console.error("Error getting visitor data stats:", error);
    res.status(500).json({ error: "Failed to retrieve data statistics" });
  }
}

// Clean up old visitor data
async function cleanupVisitorData(req, res) {
  try {
    // Get retention months from request or use default
    const retentionMonths = req.body.retentionMonths || 6;

    // Validate input
    if (typeof retentionMonths !== "number" || retentionMonths < 1) {
      return res.status(400).json({
        error: "Invalid retention period. Must be a positive number.",
      });
    }

    // Perform cleanup
    const result = await visitorService.cleanupVisitorData(retentionMonths);
    res.json(result);
  } catch (error) {
    console.error("Error cleaning up visitor data:", error);
    res.status(500).json({ error: "Failed to clean up visitor data" });
  }
}

// Delete specific month data
async function deleteMonthData(req, res) {
  try {
    const { month } = req.params;

    // Validate month format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res
        .status(400)
        .json({ error: "Invalid month format. Use YYYY-MM format." });
    }

    // Delete the data
    const result = await VisitorModel.deleteOne({ monthKey: month });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Month not found" });
    }

    res.json({
      success: true,
      message: `Data for ${month} deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting month data:", error);
    res.status(500).json({ error: "Failed to delete month data" });
  }
}

module.exports = {
  getMonthlyVisitors,
  getMonthlyVisitorDetails,
  getVisitorDataStats,
  cleanupVisitorData,
  deleteMonthData,
};
