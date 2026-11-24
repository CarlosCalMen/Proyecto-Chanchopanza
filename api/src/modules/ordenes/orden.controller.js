'use strict';

const ordenService = require('./orden.service');
const apiResponse  = require('../../helpers/apiResponse');

/**
 * GET /api/ordenes
 * Query: ?sucursalId=&clienteId=&empleadoId=&estado=&fechaDesde=&fechaHasta=&page=&limit=
 * Roles: admin, socio, caja
 * El cajero solo ve las órdenes de su propia sucursal (restringido en el service).
 */
const list = async (req, res, next) => {
  try {
    const {
      sucursalId, clienteId, empleadoId,
      estado, fechaDesde, fechaHasta,
      page, limit,
    } = req.query;

    const result = await ordenService.listOrdenes({
      sucursalId: sucursalId ? parseInt(sucursalId) : undefined,
      clienteId:  clienteId  ? parseInt(clienteId)  : undefined,
      empleadoId: empleadoId ? parseInt(empleadoId) : undefined,
      estado,
      fechaDesde,
      fechaHasta,
      page,
      limit,
      usuario: req.usuario,
    });

    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Órdenes obtenidas correctamente',
      data: result.items,
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/ordenes/:id
 * Roles: admin, socio, caja
 */
const getById = async (req, res, next) => {
  try {
    const orden = await ordenService.getOrdenById(req.params.id, req.usuario);
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Orden obtenida correctamente',
      data: orden,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/ordenes
 * Roles: admin, caja
 * Body: { clienteId?, detalles: [{ productoId, cantidad }], sucursalId?, pagos? | metodoPago? }
 * Sin clienteId la venta es al cliente mostrador ('Cliente Rápido').
 * Si se envían los pagos, la orden se cobra y queda completada en la misma operación.
 * El empleado se toma del token. El cajero siempre opera en su sucursal;
 * el admin puede indicar sucursalId (si no, usa la suya).
 */
const create = async (req, res, next) => {
  try {
    const orden = await ordenService.createOrden(req.body, req.usuario);
    return apiResponse.success(res, {
      statusCode: 201,
      message: orden.estado === 'completado'
        ? 'Orden creada y cobrada correctamente'
        : 'Orden creada correctamente',
      data: orden,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/ordenes/:id
 * Roles: admin, caja
 * Solo órdenes en estado 'pendiente'.
 * Body: { detalles: [{ productoId, cantidad }] }
 */
const update = async (req, res, next) => {
  try {
    const orden = await ordenService.updateOrden(req.params.id, req.body, req.usuario);
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Orden actualizada correctamente',
      data: orden,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/ordenes/:id/estado
 * Roles: admin, caja
 * Body: { estado: 'en_proceso' | 'completado' | 'cancelado' | 'anulado' }
 *
 * Máquina de estados:
 *   pendiente  → en_proceso | cancelado
 *   en_proceso → cancelado
 *   completado → anulado  (solo admin)
 *   cancelado  → anulado  (solo admin)
 *   anulado    → (terminal, sin transición)
 */
const cambiarEstado = async (req, res, next) => {
  try {
    const orden = await ordenService.cambiarEstado(
      req.params.id,
      req.body.estado,
      req.usuario
    );
    return apiResponse.success(res, {
      statusCode: 200,
      message: `Estado de la orden actualizado a "${req.body.estado}"`,
      data: orden,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/ordenes/:id/pago
 * Registra el cobro de la orden y la completa. Admite pago único o dividido.
 * Roles: admin, caja
 *
 * Dividido:  { pagos: [{ metodoPago, monto, montoRecibido? }, ...] }  (suma = total)
 * Único:     { metodoPago, montoRecibido? }                          (cubre el total)
 */
const pagar = async (req, res, next) => {
  try {
    const orden = await ordenService.registrarPago(req.params.id, req.body, req.usuario);
    return apiResponse.success(res, {
      statusCode: 201,
      message: 'Cobro registrado y orden completada',
      data: orden,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getById, create, update, cambiarEstado, pagar };
