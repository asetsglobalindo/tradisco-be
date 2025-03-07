const VisitorModel = require("../models/visitor");
const {
  SESSION_TIMEOUT,
  DATA_RETENTION_MONTHS,
} = require("../config/constants");

// Function to get current month key
function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// Function to read visitor data for a specific month
async function readMonthData(monthKey) {
  try {
    let monthData = await VisitorModel.findOne({ monthKey });

    // Create default data if not exists
    if (!monthData) {
      monthData = new VisitorModel({
        monthKey,
        total_visitors: 0,
        unique_visitors: [],
        visitors_by_ip: {},
        visitor_sessions: {},
      });
      await monthData.save();
    }

    return monthData;
  } catch (error) {
    console.error(`Error reading visitor data for ${monthKey}:`, error);
    return {
      total_visitors: 0,
      unique_visitors: [],
      visitors_by_ip: {},
      visitor_sessions: {},
    };
  }
}

// Function to read visitor data with current month
async function readVisitorData() {
  const monthKey = getCurrentMonthKey();

  try {
    const monthData = await readMonthData(monthKey);
    return { [monthKey]: monthData };
  } catch (error) {
    console.error("Error reading visitor data:", error);
    return { [monthKey]: {} };
  }
}

// Function to write visitor data
async function writeVisitorData(data) {
  const monthKey = getCurrentMonthKey();
  const monthData = data[monthKey];

  try {
    // Upsert the document
    await VisitorModel.findOneAndUpdate({ monthKey }, monthData, {
      upsert: true,
      new: true,
    });

    // Apply data retention policy
    await applyDataRetentionPolicy();
  } catch (error) {
    console.error(`Error writing visitor data for ${monthKey}:`, error);
  }
}

// Apply data retention policy to remove old data
async function applyDataRetentionPolicy() {
  try {
    const currentDate = new Date();
    const cutoffDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - DATA_RETENTION_MONTHS,
      1
    );

    await VisitorModel.deleteMany({
      created_at: { $lt: cutoffDate },
    });

    console.log(`Deleted visitor data older than ${cutoffDate.toISOString()}`);
  } catch (error) {
    console.error("Error applying data retention policy:", error);
  }
}

// Get all available months data
async function getAllMonthsData() {
  try {
    const visitorData = await VisitorModel.find({}).sort({ monthKey: -1 });

    // Convert to a key-value object
    const dataMap = {};
    visitorData.forEach((data) => {
      dataMap[data.monthKey] = data;
    });

    return dataMap;
  } catch (error) {
    console.error("Error reading all months data:", error);
    return {};
  }
}

// Track unique visitor
async function trackVisitor(visitorId, clientIp) {
  const monthKey = getCurrentMonthKey();

  try {
    // Sanitize visitorId and clientIp to replace periods with underscores
    const sanitizedVisitorId = visitorId.replace(/\./g, "_");
    const sanitizedClientIp = clientIp.replace(/\./g, "_");

    // Find or create document for the month
    let monthData = await VisitorModel.findOne({ monthKey });

    if (!monthData) {
      monthData = new VisitorModel({
        monthKey,
        total_visitors: 0,
        unique_visitors: [],
        visitors_by_ip: {},
        visitor_sessions: {},
      });
    }

    // Add visitorId to unique_visitors if not already present
    if (!monthData.unique_visitors.includes(sanitizedVisitorId)) {
      monthData.unique_visitors.push(sanitizedVisitorId);
      monthData.total_visitors++;
    }

    // Update session timestamp
    monthData.visitor_sessions.set(sanitizedVisitorId, new Date().getTime());

    // Update visits by IP
    const currentIpVisits =
      monthData.visitors_by_ip.get(sanitizedClientIp) || 0;
    monthData.visitors_by_ip.set(sanitizedClientIp, currentIpVisits + 1);

    // Save updated data
    await monthData.save();

    return { [monthKey]: monthData };
  } catch (error) {
    console.error("Error tracking visitor:", error);
    return {};
  }
}

// Calculate active sessions
function calculateActiveSessions(monthData) {
  if (!monthData || !monthData.visitor_sessions) return 0;

  const now = new Date().getTime();
  let activeSessions = 0;

  // Convert Map to plain object for iteration
  const sessionMap = monthData.visitor_sessions;
  for (const [visitorId, lastVisit] of sessionMap.entries()) {
    if (now - lastVisit < SESSION_TIMEOUT) {
      activeSessions++;
    }
  }

  return activeSessions;
}

// Get statistics about data retention
async function getDataRetentionStats() {
  try {
    const totalMonths = await VisitorModel.countDocuments();
    const stats = await VisitorModel.aggregate([
      {
        $group: {
          _id: null,
          totalVisitors: { $sum: "$total_visitors" },
          totalUniqueVisitors: { $sum: { $size: "$unique_visitors" } },
        },
      },
    ]);

    const totalSize = await VisitorModel.estimatedDocumentCount();

    return {
      totalMonths,
      totalVisitors: stats[0]?.totalVisitors || 0,
      totalUniqueVisitors: stats[0]?.totalUniqueVisitors || 0,
      totalSizeDocuments: totalSize,
      retentionPolicy: `${DATA_RETENTION_MONTHS} months`,
    };
  } catch (error) {
    console.error("Error getting data retention stats:", error);
    return {
      error: error.message,
    };
  }
}

// Clean up visitor data based on retention period
async function cleanupVisitorData(retentionMonths) {
  try {
    const currentDate = new Date();
    const cutoffDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - retentionMonths,
      1
    );

    const result = await VisitorModel.deleteMany({
      created_at: { $lt: cutoffDate },
    });

    return {
      success: true,
      deletedCount: result.deletedCount,
      message: `Deleted visitor data older than ${cutoffDate.toISOString()}`,
    };
  } catch (error) {
    console.error("Error cleaning up visitor data:", error);
    throw error;
  }
}

async function getVisitorDataInRange(startMonth, endMonth) {
  try {
    // Query untuk mendapatkan data pengunjung dalam rentang bulan yang diberikan
    const data = await VisitorModel.aggregate([
      {
        $match: {
          monthKey: {
            $gte: startMonth,
            $lte: endMonth,
          },
        },
      },
      {
        $group: {
          _id: "$monthKey", // Kelompokkan berdasarkan monthKey
          total_visitors: { $sum: "$total_visitors" }, // Menjumlahkan total pengunjung
          unique_visitors_count: { $sum: { $size: "$unique_visitors" } }, // Menjumlahkan pengunjung unik
        },
      },
      {
        $sort: { _id: 1 }, // Urutkan berdasarkan bulan
      },
    ]);

    return data;
  } catch (error) {
    console.error("Error getting visitor data in range:", error);
    throw error;
  }
}

module.exports = {
  getCurrentMonthKey,
  readVisitorData,
  writeVisitorData,
  trackVisitor,
  getAllMonthsData,
  getDataRetentionStats,
  calculateActiveSessions,
  cleanupVisitorData,
  getVisitorDataInRange,
  DATA_RETENTION_MONTHS,
};
