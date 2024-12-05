const express = require('express');
const middleware = require('../helper/middleware');
const router = express.Router(),
  Controller = require('../controllers/EmailController');

router.get('/', middleware.authAdmin, Controller.get);
router.get('/detail/:email_id', middleware.authAdmin, Controller.getDetail);
router.post('/', middleware.authAdmin, Controller.add);
router.post('/check', middleware.authAdmin, Controller.check);
router.post('/edit', middleware.authAdmin, Controller.update);
router.delete('/', middleware.authAdmin, Controller.delete);

module.exports = router;
