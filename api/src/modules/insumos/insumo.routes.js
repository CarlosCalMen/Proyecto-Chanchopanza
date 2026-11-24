'use strict';

const { Router } = require('express');

const insumoController   = require('./insumo.controller');
const validation          = require('./insumo.validation');
const validateMiddleware  = require('../../middlewares/validate.middleware');
const authMiddleware      = require('../../middlewares/auth.middleware');
const roleMiddleware      = require('../../middlewares/role.middleware');

const router = Router();

// Todas las rutas requieren token válido
router.use(authMiddleware);

/**
 * GET /api/insumos
 * Query: ?search=&stockBajo=&page=&limit=
 * Roles: admin, socio
 *
 * El filtro ?stockBajo=5 retorna todos los insumos con stock <= 5,
 * útil para generar alertas de reposición.
 */
router.get(
  '/',
  roleMiddleware('admin', 'socio'),
  validation.listRules,
  validateMiddleware,
  insumoController.list
);

/**
 * GET /api/insumos/:id
 * Roles: admin, socio
 */
router.get(
  '/:id',
  roleMiddleware('admin', 'socio'),
  validation.getByIdRules,
  validateMiddleware,
  insumoController.getById
);

/**
 * POST /api/insumos
 * Roles: admin
 */
router.post(
  '/',
  roleMiddleware('admin'),
  validation.createInsumoRules,
  validateMiddleware,
  insumoController.create
);

/**
 * PUT /api/insumos/:id
 * Roles: admin
 */
router.put(
  '/:id',
  roleMiddleware('admin'),
  validation.updateInsumoRules,
  validateMiddleware,
  insumoController.update
);

/**
 * PATCH /api/insumos/:id/stock
 * Ajuste manual de stock — entrada o salida administrativa.
 * Roles: admin
 *
 * Body: { cantidad: number, tipo: 'entrada' | 'salida' }
 *
 * Nota: el stock también se actualiza automáticamente al registrar
 * una compra (módulo compras). Este endpoint es para ajustes manuales
 * por merma, inventario físico, etc.
 */
router.patch(
  '/:id/stock',
  roleMiddleware('admin'),
  validation.ajustarStockRules,
  validateMiddleware,
  insumoController.ajustarStock
);

/**
 * DELETE /api/insumos/:id
 * Roles: admin
 */
router.delete(
  '/:id',
  roleMiddleware('admin'),
  validation.deleteRules,
  validateMiddleware,
  insumoController.remove
);

module.exports = router;
