const express = require('express');
const middleware = require('../helper/middleware');
const router = express.Router(),
  Controller = require('../controllers/OrganizationController');

router.get('/', middleware.authAdmin, Controller.get);
router.get('/:organization_id', middleware.authAdmin, Controller.getDetail);
router.post('/',  Controller.add);
router.post('/build-organization',  Controller.buildOrganization);
router.post('/edit', middleware.authAdmin, Controller.update);
router.delete('/', middleware.authAdmin, Controller.delete);
router.post('/convert',  middleware.authAdmin, Controller.updateCurrencyNominal);
router.post('/email-count',  middleware.authAdmin, Controller.updateEmailCountTest);
router.post('/setting-checkout',  middleware.authAdmin, Controller.updateCheckoutSetting);
router.post('/currency',  middleware.authAdmin, Controller.updateCurrency);
router.post('/address',  middleware.authAdmin, Controller.updateOrganizationAddress);
router.post('/revert-product',  middleware.authAdmin, Controller.updateRevertProductSetting);
router.post('/vip',  middleware.authAdmin, Controller.requirementVIP);

module.exports = router;
