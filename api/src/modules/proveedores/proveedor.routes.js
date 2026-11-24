'use strict';

const { Router } = require('express');

const proveedorController = require('./proveedor.controller');
const validation           = require('./proveedor.validation');
const validateMiddleware   = require('../../middlewares/validate.middleware');
const authMiddleware       = require('../../middlewares/auth.middleware');
const roleMiddleware       = require('../../middlewares/role.middleware');

const router = Router();

// Todas las rutas requieren token válido
router.use(authMiddleware);

/**
 * GET /api/proveedores
 * Roles: admin, socio
 * El cajero no gestiona proveedores ni compras.
 */
router.get(
  '/',
  roleMiddleware('admin', 'socio'),
  validation.listRules,
  validateMiddleware,
  proveedorController.list
);

/**
 * GET /api/proveedores/:id
 * Roles: admin, socio
 */
router.get(
  '/:id',
  roleMiddleware('admin', 'socio'),
  validation.getByIdRules,
  validateMiddleware,
  proveedorController.getById
);

/**
 * POST /api/proveedores
 * Roles: admin
 */
router.post(
  '/',
  roleMiddleware('admin'),
  validation.createProveedorRules,
  validateMiddleware,
  proveedorController.create
);

/**
 * PUT /api/proveedores/:id
 * Roles: admin
 */
router.put(
  '/:id',
  roleMiddleware('admin'),
  validation.updateProveedorRules,
  validateMiddleware,
  proveedorController.update
);

/**
 * DELETE /api/proveedores/:id
 * Roles: admin
 */
router.delete(
  '/:id',
  roleMiddleware('admin'),
  validation.deleteRules,
  validateMiddleware,
  proveedorController.remove
);

module.exports = router;
