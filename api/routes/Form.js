const express = require('express');
const middleware = require('../helper/middleware');
const router = express.Router(),
  Controller = require('../controllers/FormController');

router.get('/', middleware.authAdmin, Controller.get);
router.post('/', middleware.authGuest, Controller.add);
router.delete('/', middleware.authAdmin, Controller.delete);

module.exports = router;
