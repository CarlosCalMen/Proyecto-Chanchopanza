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
 * Body: { clienteId?, detalles: [{ productoId, cantidad }], sucursalId?, pagos? | metodoPago? }
 * Sin clienteId la venta es al cliente mostrador ('Cliente Rápido').
 * Con pagos (mismo formato que /:id/pago) crea, cobra y completa en UNA operación:
 * todo o nada (orden, stock y cobro).
 * El empleado sale del token. Reserva el stock de insumos según las recetas.
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
 *   pendiente → en_proceso
 *   pendiente | en_proceso → cancelado   (devuelve el stock)
 *
 * Exclusivo admin:
 *   completado → anulado   (devuelve el stock y anula el cobro)
 *   cancelado  → anulado
 *
 * 'completado' NO se asigna aquí: ocurre al cobrar (POST /:id/pago).
 */
router.patch(
  '/:id/estado',
  roleMiddleware('admin', 'caja'),
  validation.cambiarEstadoRules,
  validateMiddleware,
  ordenController.cambiarEstado
);

/**
 * POST /api/ordenes/:id/pago
 * Roles: admin, caja
 *
 * Cobro dividido (varios métodos; la suma de los montos debe ser el total):
 *   { "pagos": [
 *       { "metodoPago": "efectivo", "monto": 30, "montoRecibido": 50 },
 *       { "metodoPago": "tarjeta",  "monto": 20 },
 *       { "metodoPago": "yape",     "monto": 8 }
 *   ] }
 *
 * Pago único (formato anterior):
 *   { "metodoPago": "efectivo", "montoRecibido": 100 }
 *
 * Métodos: efectivo | tarjeta | yape | plin | transferencia.
 * Es todo o nada: si algo falla no queda ningún pago registrado.
 * Solo se puede cobrar una orden 'pendiente' o 'en_proceso'.
 */
router.post(
  '/:id/pago',
  roleMiddleware('admin', 'caja'),
  validation.pagoRules,
  validateMiddleware,
  ordenController.pagar
);

module.exports = router;
