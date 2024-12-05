const express = require('express');
const middleware = require('../helper/middleware');
const router = express.Router(),
  Controller = require('../controllers/RolePageController');

router.get('/', middleware.authAdmin, Controller.get);
router.get('/menu', middleware.authUser, Controller.getMenu);
router.post('/', middleware.authAdmin, Controller.add);
router.post('/global', middleware.authAdmin, Controller.addPageGlobal);
router.post('/edit', middleware.authAdmin, Controller.update);
router.delete('/', middleware.authAdmin, Controller.delete);

module.exports = router;
