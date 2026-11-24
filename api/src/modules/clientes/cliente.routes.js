'use strict';

const { Router } = require('express');

const clienteController  = require('./cliente.controller');
const validation          = require('./cliente.validation');
const validateMiddleware  = require('../../middlewares/validate.middleware');
const authMiddleware      = require('../../middlewares/auth.middleware');
const roleMiddleware      = require('../../middlewares/role.middleware');

const router = Router();

// Todas las rutas requieren token válido
router.use(authMiddleware);

/**
 * GET /api/clientes
 * Roles: admin, socio, caja
 * El cajero necesita buscar clientes al registrar una orden.
 */
router.get(
  '/',
  roleMiddleware('admin', 'socio', 'caja'),
  validation.listRules,
  validateMiddleware,
  clienteController.list
);

/**
 * GET /api/clientes/mostrador
 * Roles: admin, socio, caja
 * Cliente por defecto de las ventas sin datos del cliente. Debe declararse
 * ANTES de '/:id', o 'mostrador' se interpretaría como un id.
 */
router.get(
  '/mostrador',
  roleMiddleware('admin', 'socio', 'caja'),
  clienteController.getMostrador
);

/**
 * GET /api/clientes/:id
 * Roles: admin, socio, caja
 */
router.get(
  '/:id',
  roleMiddleware('admin', 'socio', 'caja'),
  validation.getByIdRules,
  validateMiddleware,
  clienteController.getById
);

/**
 * POST /api/clientes
 * Roles: admin, caja
 * El cajero puede registrar un cliente nuevo al momento de atenderlo.
 */
router.post(
  '/',
  roleMiddleware('admin', 'caja'),
  validation.createClienteRules,
  validateMiddleware,
  clienteController.create
);

/**
 * PUT /api/clientes/:id
 * Roles: admin, caja
 * El cajero puede corregir datos del cliente (teléfono, email, etc.).
 */
router.put(
  '/:id',
  roleMiddleware('admin', 'caja'),
  validation.updateClienteRules,
  validateMiddleware,
  clienteController.update
);

/**
 * DELETE /api/clientes/:id
 * Roles: admin
 * Solo admin puede eliminar — y solo si el cliente no tiene historial.
 */
router.delete(
  '/:id',
  roleMiddleware('admin'),
  validation.deleteRules,
  validateMiddleware,
  clienteController.remove
);

module.exports = router;
