const express = require('express');
const middleware = require('../helper/middleware');
const router = express.Router(),
  Controller = require('../controllers/HomeController');

router.get('/health', Controller.health);
router.get('/home', middleware.authAdmin, Controller.get);
router.get('/home/content', Controller.content);
router.post('/home', middleware.authAdmin, Controller.add);

module.exports = router;
