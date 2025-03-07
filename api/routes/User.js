const express = require("express");
const middleware = require("../helper/middleware");
const router = express.Router(),
  Controller = require("../controllers/UserController");

router.get("/", middleware.authAdmin, Controller.get);
router.get("/detail/:user_id", middleware.authUser, Controller.getDetail);
router.get("/count", middleware.authUser, Controller.countUsers);
router.get("/activate/:token", Controller.activateUser);
router.post("/", middleware.authAdmin, Controller.add);
router.post("/sign-up", Controller.register);
router.post("/login", Controller.login);
router.post("/edit", middleware.authAdmin, Controller.update);
router.delete("/", middleware.authAdmin, Controller.delete);

router.post("/auth-thirdparty", Controller.loginThirdParty);
router.post("/forgot-password", Controller.sendOtpForgotPassword);
router.post("/verify", Controller.verifyOtpForgotPassword);
router.post("/reset-password", Controller.resetPassword);
router.post("/change-password", middleware.authUser, Controller.changePassword);

router.post("/profile", middleware.authUser, Controller.updateProfile);

module.exports = router;
