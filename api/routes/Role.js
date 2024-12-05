const express = require('express');
const middleware = require('../helper/middleware');
const router = express.Router(),
  Controller = require('../controllers/RoleController');

router.get('/', middleware.authAdmin, Controller.get);
router.get('/:role_id', middleware.authAdmin, Controller.getDetail);
router.post('/', middleware.authAdmin, Controller.add);
router.post('/build-role', Controller.buildRole);
router.post('/edit', middleware.authAdmin, Controller.update);
router.delete('/', middleware.authAdmin, Controller.delete);

module.exports = router;
