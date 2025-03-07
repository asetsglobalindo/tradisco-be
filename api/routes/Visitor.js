const express = require("express");
const middleware = require("../helper/middleware");
const router = express.Router(),
  Controller = require("../controllers/VisitorController");

router.get("/stats", middleware.authAdmin, Controller.getMonthlyVisitors);
router.get(
  "/details",
  middleware.authAdmin,
  Controller.getMonthlyVisitorDetails
);
router.get(
  "/visitor-stats",
  middleware.authAdmin,
  Controller.getVisitorDataStats
);
router.post(
  "/cleanup-visitor-data",
  middleware.authAdmin,
  Controller.cleanupVisitorData
);
// Menghapus data bulan tertentu
router.delete(
  "/visitor-data/:month",
  middleware.authAdmin,
  Controller.deleteMonthData
);

module.exports = router;
