'use strict';

const { Router } = require('express');

const compraController   = require('./compra.controller');
const validation          = require('./compra.validation');
const validateMiddleware  = require('../../middlewares/validate.middleware');
const authMiddleware      = require('../../middlewares/auth.middleware');
const roleMiddleware      = require('../../middlewares/role.middleware');

const router = Router();

// Todas las rutas requieren token válido
router.use(authMiddleware);

/**
 * GET /api/compras
 * Roles: admin, socio
 * El cajero no tiene acceso al módulo de compras.
 *
 * Filtros disponibles:
 *   ?sucursalId=  ?proveedorId=  ?empleadoId=
 *   ?estado=      ?fechaDesde=   ?fechaHasta=
 *   ?page=        ?limit=
 */
router.get(
  '/',
  roleMiddleware('admin', 'socio'),
  validation.listRules,
  validateMiddleware,
  compraController.list
);

/**
 * GET /api/compras/:id
 * Roles: admin, socio
 */
router.get(
  '/:id',
  roleMiddleware('admin', 'socio'),
  validation.getByIdRules,
  validateMiddleware,
  compraController.getById
);

/**
 * POST /api/compras
 * Roles: admin
 * Body: { proveedorId, sucursalId, empleadoId, detalles: [{ insumoId, cantidad, costoUnitario }] }
 *
 * La compra se crea en estado 'pendiente'.
 * El stock de insumos NO se modifica hasta pasar a 'recibido'.
 */
router.post(
  '/',
  roleMiddleware('admin'),
  validation.createCompraRules,
  validateMiddleware,
  compraController.create
);

/**
 * PUT /api/compras/:id
 * Roles: admin
 * Solo edita compras en estado 'pendiente'.
 * Body: { detalles: [{ insumoId, cantidad, costoUnitario }] }
 */
router.put(
  '/:id',
  roleMiddleware('admin'),
  validation.updateCompraRules,
  validateMiddleware,
  compraController.update
);

/**
 * PATCH /api/compras/:id/estado
 * Roles: admin
 * Body: { estado: string }
 *
 * Flujo y efectos en stock:
 *   pendiente → recibido  : ✅ suma stock de cada insumo
 *   pendiente → cancelado : sin efecto en stock
 *   recibido  → anulado   : ✅ revierte stock (falla si quedaría negativo)
 *   cancelado → anulado   : sin efecto en stock
 */
router.patch(
  '/:id/estado',
  roleMiddleware('admin'),
  validation.cambiarEstadoRules,
  validateMiddleware,
  compraController.cambiarEstado
);

module.exports = router;
