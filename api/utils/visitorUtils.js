const path = require("path");
const fs = require("fs");

// Cache data
let currentMonthData = null;
let currentMonth = "";
const dataFolder = path.join(__dirname, "visitor_data");

// Data retention configuration (in months)
const DATA_RETENTION_MONTHS = 6; // Menyimpan data selama 6 bulan

// Ensure data folder exists
if (!fs.existsSync(dataFolder)) {
  try {
    fs.mkdirSync(dataFolder, { recursive: true });
  } catch (error) {
    console.error("Error creating data folder:", error);
  }
}

// Function to get current month key
function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// Function to get file path for a specific month
function getMonthFilePath(monthKey) {
  return path.join(dataFolder, `visitors-${monthKey}.json`);
}

// Function to read visitor data for a specific month
function readMonthData(monthKey) {
  const filePath = getMonthFilePath(monthKey);

  // Create default file if it doesn't exist
  if (!fs.existsSync(filePath)) {
    const defaultData = {
      total_visitors: 0,
      unique_visitors: [],
      visitors_by_ip: {},
      visitor_sessions: {},
    };

    try {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    } catch (error) {
      console.error(`Error creating default data file for ${monthKey}:`, error);
      return defaultData;
    }
  }

  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
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

// Function to read visitor data with caching
function readVisitorData() {
  const monthKey = getCurrentMonthKey();

  // Use cache if available and current
  if (monthKey === currentMonth && currentMonthData) {
    return { [monthKey]: currentMonthData };
  }

  // Read from file
  currentMonth = monthKey;
  currentMonthData = readMonthData(monthKey);

  return { [monthKey]: currentMonthData };
}

// Function to write visitor data with lock file
function writeVisitorData(data) {
  const monthKey = getCurrentMonthKey();
  const monthData = data[monthKey];
  const filePath = getMonthFilePath(monthKey);
  const lockFile = `${filePath}.lock`;

  // Check if lock exists
  if (fs.existsSync(lockFile)) {
    const lockAge = Date.now() - fs.statSync(lockFile).mtimeMs;

    // If lock is older than 5 seconds, assume it's stale and remove it
    if (lockAge > 5000) {
      try {
        fs.unlinkSync(lockFile);
      } catch (error) {
        console.error("Error removing stale lock:", error);
        return;
      }
    } else {
      // Wait and retry if lock is recent
      setTimeout(() => writeVisitorData(data), 100);
      return;
    }
  }

  // Create lock file
  try {
    fs.writeFileSync(lockFile, Date.now().toString());
  } catch (error) {
    console.error("Error creating lock file:", error);
    return;
  }

  try {
    // Update cache
    currentMonthData = monthData;
    currentMonth = monthKey;

    // Write to file
    fs.writeFileSync(filePath, JSON.stringify(monthData, null, 2));

    // Apply data retention policy after updating data
    applyDataRetentionPolicy();
  } catch (error) {
    console.error(`Error writing visitor data for ${monthKey}:`, error);
  } finally {
    // Remove lock file
    try {
      fs.unlinkSync(lockFile);
    } catch (error) {
      console.error("Error removing lock file:", error);
    }
  }
}

// Apply data retention policy to remove old data
function applyDataRetentionPolicy() {
  try {
    const files = fs.readdirSync(dataFolder);
    const currentDate = new Date();

    files.forEach((file) => {
      if (file.startsWith("visitors-") && file.endsWith(".json")) {
        const monthKey = file.replace("visitors-", "").replace(".json", "");
        const [year, month] = monthKey.split("-").map(Number);

        // Calculate how many months old this file is
        const fileDate = new Date(year, month - 1); // month is 0-indexed in JS Date
        const monthsDiff =
          (currentDate.getFullYear() - fileDate.getFullYear()) * 12 +
          (currentDate.getMonth() - fileDate.getMonth());

        // Delete if older than retention period
        if (monthsDiff > DATA_RETENTION_MONTHS) {
          const filePath = path.join(dataFolder, file);
          fs.unlinkSync(filePath);
          console.log(
            `Deleted old visitor data: ${file} (${monthsDiff} months old)`
          );
        }
      }
    });
  } catch (error) {
    console.error("Error applying data retention policy:", error);
  }
}

// Manually trigger data cleanup
function cleanupOldData(retentionMonths = DATA_RETENTION_MONTHS) {
  try {
    const files = fs.readdirSync(dataFolder);
    const currentDate = new Date();
    let deletedCount = 0;

    files.forEach((file) => {
      if (file.startsWith("visitors-") && file.endsWith(".json")) {
        const monthKey = file.replace("visitors-", "").replace(".json", "");
        const [year, month] = monthKey.split("-").map(Number);

        // Calculate how many months old this file is
        const fileDate = new Date(year, month - 1); // month is 0-indexed in JS Date
        const monthsDiff =
          (currentDate.getFullYear() - fileDate.getFullYear()) * 12 +
          (currentDate.getMonth() - fileDate.getMonth());

        // Delete if older than retention period
        if (monthsDiff > retentionMonths) {
          const filePath = path.join(dataFolder, file);
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
    });

    return {
      success: true,
      deletedCount: deletedCount,
      message: `Deleted ${deletedCount} months of old visitor data`,
    };
  } catch (error) {
    console.error("Error cleaning up old data:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Get all available months data
function getAllMonthsData() {
  try {
    const files = fs.readdirSync(dataFolder);
    const visitorData = {};

    files.forEach((file) => {
      if (file.startsWith("visitors-") && file.endsWith(".json")) {
        const monthKey = file.replace("visitors-", "").replace(".json", "");
        visitorData[monthKey] = readMonthData(monthKey);
      }
    });

    return visitorData;
  } catch (error) {
    console.error("Error reading all months data:", error);
    return {};
  }
}

// Function to track unique visitor
function trackVisitor(visitorId) {
  const monthKey = getCurrentMonthKey();
  const visitorData = readVisitorData();

  if (!visitorData[monthKey]) {
    visitorData[monthKey] = {
      total_visitors: 0,
      unique_visitors: [],
      visitors_by_ip: {},
      visitor_sessions: {},
    };
  }

  // Add visitorId to unique_visitors if not already present
  if (!visitorData[monthKey].unique_visitors.includes(visitorId)) {
    visitorData[monthKey].unique_visitors.push(visitorId);
    visitorData[monthKey].total_visitors++;
  }

  // Update session timestamp
  visitorData[monthKey].visitor_sessions[visitorId] = new Date().getTime();

  // Save updated data
  writeVisitorData(visitorData);

  return visitorData;
}

// Get statistics about data retention
function getDataRetentionStats() {
  try {
    const files = fs.readdirSync(dataFolder);
    const months = [];
    let totalSize = 0;

    files.forEach((file) => {
      if (file.startsWith("visitors-") && file.endsWith(".json")) {
        const filePath = path.join(dataFolder, file);
        const stats = fs.statSync(filePath);
        const monthKey = file.replace("visitors-", "").replace(".json", "");

        months.push({
          month: monthKey,
          size: stats.size,
          modified: stats.mtime,
        });

        totalSize += stats.size;
      }
    });

    return {
      totalMonths: months.length,
      totalSizeBytes: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      retentionPolicy: `${DATA_RETENTION_MONTHS} months`,
      months: months.sort((a, b) => b.month.localeCompare(a.month)), // Sort newest first
    };
  } catch (error) {
    console.error("Error getting data retention stats:", error);
    return {
      error: error.message,
    };
  }
}

module.exports = {
  getCurrentMonthKey,
  readVisitorData,
  writeVisitorData,
  trackVisitor,
  getAllMonthsData,
  cleanupOldData,
  getDataRetentionStats,
  DATA_RETENTION_MONTHS,
};
