'use strict';

const { Router } = require('express');

const ordenController    = require('./orden.controller');
const validation          = require('./orden.validation');
const validateMiddleware  = require('../../middlewares/validate.middleware');
const authMiddleware      = require('../../middlewares/auth.middleware');
const roleMiddleware      = require('../../middlewares/role.middleware');

const router = Router();

// Todas las rutas requieren token válido
router.use(authMiddleware);

/**
 * GET /api/ordenes
 * Roles: admin, socio, caja
 *
 * Filtros disponibles:
 *   ?sucursalId=  ?clienteId=  ?empleadoId=
 *   ?estado=      ?fechaDesde= ?fechaHasta=
 *   ?page=        ?limit=
 *
 * El cajero solo ve las órdenes de su sucursal (el service lo restringe
 * usando req.usuario.sucursalId, ignorando el filtro sucursalId del query).
 */
router.get(
  '/',
  roleMiddleware('admin', 'socio', 'caja'),
  validation.listRules,
  validateMiddleware,
  ordenController.list
);

/**
 * GET /api/ordenes/:id
 * Roles: admin, socio, caja
 */
router.get(
  '/:id',
  roleMiddleware('admin', 'socio', 'caja'),
  validation.getByIdRules,
  validateMiddleware,
  ordenController.getById
);

/**
 * POST /api/ordenes
 * Roles: admin, caja
 * Body: { clienteId, sucursalId, empleadoId, detalles: [{ productoId, cantidad }] }
 */
router.post(
  '/',
  roleMiddleware('admin', 'caja'),
  validation.createOrdenRules,
  validateMiddleware,
  ordenController.create
);

/**
 * PUT /api/ordenes/:id
 * Roles: admin, caja
 * Solo edita órdenes en estado 'pendiente'.
 * Reemplaza todos los detalles y recalcula el total.
 * Body: { detalles: [{ productoId, cantidad }] }
 */
router.put(
  '/:id',
  roleMiddleware('admin', 'caja'),
  validation.updateOrdenRules,
  validateMiddleware,
  ordenController.update
);

/**
 * PATCH /api/ordenes/:id/estado
 * Roles: admin, caja
 * Body: { estado: string }
 *
 * Flujo del cajero:
 *   pendiente → en_proceso → completado
 *   pendiente → cancelado
 *   en_proceso → cancelado
 *
 * Exclusivo admin:
 *   completado → anulado
 *   cancelado  → anulado
 */
router.patch(
  '/:id/estado',
  roleMiddleware('admin', 'caja'),
  validation.cambiarEstadoRules,
  validateMiddleware,
  ordenController.cambiarEstado
);

module.exports = router;
