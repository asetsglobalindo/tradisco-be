const express = require("express");
const middleware = require("../helper/middleware");
const router = express.Router(),
  Controller = require("../controllers/ContentController");

router.get("/banner", Controller.getBanner);
router.get("/", Controller.get);
router.get("/detail/:content_id", Controller.getDetail);
router.post("/", middleware.authAdmin, Controller.add);
router.post("/edit", middleware.authAdmin, Controller.update);
router.get("/body/:slug", Controller.content);
router.delete("/", middleware.authAdmin, Controller.delete);

module.exports = router;
