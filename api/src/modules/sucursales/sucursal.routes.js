'use strict';

const { Router } = require('express');

const sucursalController  = require('./sucursal.controller');
const validation           = require('./sucursal.validation');
const validateMiddleware   = require('../../middlewares/validate.middleware');
const authMiddleware       = require('../../middlewares/auth.middleware');
const roleMiddleware       = require('../../middlewares/role.middleware');

const router = Router();

// Todas las rutas requieren token válido
router.use(authMiddleware);

/**
 * GET /api/sucursales
 * Roles: admin, socio
 * El cajero no necesita ver el catálogo de sucursales — opera siempre
 * en la sucursal asignada a su perfil (sucursalId en el JWT).
 */
router.get(
  '/',
  roleMiddleware('admin', 'socio'),
  validation.listRules,
  validateMiddleware,
  sucursalController.list
);

/**
 * GET /api/sucursales/:id
 * Roles: admin, socio
 */
router.get(
  '/:id',
  roleMiddleware('admin', 'socio'),
  validation.getByIdRules,
  validateMiddleware,
  sucursalController.getById
);

/**
 * POST /api/sucursales
 * Roles: admin
 */
router.post(
  '/',
  roleMiddleware('admin'),
  validation.createSucursalRules,
  validateMiddleware,
  sucursalController.create
);

/**
 * PUT /api/sucursales/:id
 * Roles: admin
 */
router.put(
  '/:id',
  roleMiddleware('admin'),
  validation.updateSucursalRules,
  validateMiddleware,
  sucursalController.update
);

/**
 * DELETE /api/sucursales/:id
 * Roles: admin
 */
router.delete(
  '/:id',
  roleMiddleware('admin'),
  validation.deleteRules,
  validateMiddleware,
  sucursalController.remove
);

module.exports = router;
