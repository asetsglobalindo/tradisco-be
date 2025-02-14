const express = require('express');
const middleware = require('../helper/middleware');
const router = express.Router(),
  Controller = require('../controllers/FooterController');

router.get('/', middleware.authAdmin, Controller.get);
router.post('/', middleware.authAdmin, Controller.upsert);

module.exports = router;
