const express = require('express');
const middleware = require('../helper/middleware');
const router = express.Router(),
  Controller = require('../controllers/CategoryController');

router.get('/', Controller.get);
router.get('/detail/:category_id', middleware.authAdmin, Controller.getDetail);
router.post('/', middleware.authAdmin, Controller.add);
router.post('/multiple', middleware.authAdmin, Controller.addMultiple);
router.post('/edit', middleware.authAdmin, Controller.update);
router.delete('/', middleware.authAdmin, Controller.delete);

module.exports = router;
