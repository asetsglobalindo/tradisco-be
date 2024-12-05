const express = require('express');
const middleware = require('../helper/middleware');
const router = express.Router(),
  Controller = require('../controllers/AccessController');

router.get('/', Controller.get);
router.get('/detail/:access_id', middleware.authUser, Controller.getDetail);
router.get('/check/:ip_address', Controller.check);
router.post('/', middleware.authUser, Controller.add);
router.post('/multiple', middleware.authUser, Controller.addMultiple);
router.post('/edit', middleware.authAdmin, Controller.update);
router.delete('/', middleware.authAdmin, Controller.delete);

module.exports = router;
