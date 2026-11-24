'use strict';

const { Router } = require('express');

const productoController  = require('./product.controller');
const validation           = require('./product.validation');
const validateMiddleware   = require('../../middlewares/validate.middleware');
const authMiddleware       = require('../../middlewares/auth.middleware');
const roleMiddleware       = require('../../middlewares/role.middleware');

const router = Router();

// Todas las rutas de productos requieren token válido
router.use(authMiddleware);

/**
 * GET /api/productos
 * Roles: admin, socio, caja — todos necesitan leer el catálogo
 */
router.get(
  '/',
  roleMiddleware('admin', 'socio', 'caja'),
  validation.listRules,
  validateMiddleware,
  productoController.list
);

/**
 * GET /api/productos/:id
 * Roles: admin, socio, caja
 */
router.get(
  '/:id',
  roleMiddleware('admin', 'socio', 'caja'),
  validation.getByIdRules,
  validateMiddleware,
  productoController.getById
);

/**
 * POST /api/productos
 * Roles: admin
 */
router.post(
  '/',
  roleMiddleware('admin'),
  validation.createProductoRules,
  validateMiddleware,
  productoController.create
);

/**
 * PUT /api/productos/:id
 * Roles: admin
 */
router.put(
  '/:id',
  roleMiddleware('admin'),
  validation.updateProductoRules,
  validateMiddleware,
  productoController.update
);

/**
 * DELETE /api/productos/:id
 * Roles: admin
 */
router.delete(
  '/:id',
  roleMiddleware('admin'),
  validation.deleteRules,
  validateMiddleware,
  productoController.remove
);

module.exports = router;
