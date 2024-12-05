const express = require('express');
const middleware = require('../helper/middleware');
const router = express.Router(),
  Controller = require('../controllers/HeaderController');

  router.get('/', Controller.get);
  router.get('/header-footer', Controller.headerFooter);
  router.get('/detail/:header_id', middleware.authAdmin, Controller.getDetail);
  router.post('/', middleware.authAdmin, Controller.add);
  router.post('/edit', middleware.authAdmin, Controller.update);
  router.delete('/', middleware.authAdmin, Controller.delete);

module.exports = router;
