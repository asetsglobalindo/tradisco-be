const express = require('express');
const middleware = require('../helper/middleware');
const router = express.Router(),
  Controller = require('../controllers/LocationController');

router.get('/', Controller.get);
router.get('/detail/:location_id', Controller.getDetail);
router.post('/', middleware.authAdmin, Controller.add);
router.post('/edit', middleware.authAdmin, Controller.update);
router.delete('/', middleware.authAdmin, Controller.delete);

module.exports = router;
