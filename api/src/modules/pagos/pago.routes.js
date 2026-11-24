'use strict';

const { Router } = require('express');

const pagoController     = require('./pago.controller');
const validation          = require('./pago.validation');
const validateMiddleware  = require('../../middlewares/validate.middleware');
const authMiddleware      = require('../../middlewares/auth.middleware');
const roleMiddleware      = require('../../middlewares/role.middleware');

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware('admin', 'socio', 'caja'));

/**
 * GET /api/pagos
 * Listado de cobros. El cajero solo ve los suyos (en su sucursal).
 * Los cobros se REGISTRAN en POST /api/ordenes/:id/pago.
 */
router.get('/', validation.listRules, validateMiddleware, pagoController.list);

/**
 * GET /api/pagos/resumen
 * Totales por método de pago: base del cierre de caja.
 */
router.get('/resumen', validation.resumenRules, validateMiddleware, pagoController.resumen);

module.exports = router;
