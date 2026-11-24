'use strict';

const compraService = require('./compra.service');
const apiResponse   = require('../../helpers/apiResponse');

/**
 * GET /api/compras
 * Query: ?sucursalId=&proveedorId=&empleadoId=&estado=&fechaDesde=&fechaHasta=&page=&limit=
 * Roles: admin, socio
 */
const list = async (req, res, next) => {
  try {
    const {
      sucursalId, proveedorId, empleadoId,
      estado, fechaDesde, fechaHasta,
      page, limit,
    } = req.query;

    const result = await compraService.listCompras({
      sucursalId:  sucursalId  ? parseInt(sucursalId)  : undefined,
      proveedorId: proveedorId ? parseInt(proveedorId) : undefined,
      empleadoId:  empleadoId  ? parseInt(empleadoId)  : undefined,
      estado,
      fechaDesde,
      fechaHasta,
      page,
      limit,
    });

    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Compras obtenidas correctamente',
      data: result.items,
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/compras/:id
 * Roles: admin, socio
 */
const getById = async (req, res, next) => {
  try {
    const compra = await compraService.getCompraById(req.params.id);
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Compra obtenida correctamente',
      data: compra,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/compras
 * Roles: admin
 * Body: { proveedorId, detalles: [{ insumoId, cantidad, costoUnitario }], sucursalId? }
 * El empleado se toma del token; sucursalId es opcional (por defecto, la del usuario).
 */
const create = async (req, res, next) => {
  try {
    const compra = await compraService.createCompra(req.body, req.usuario);
    return apiResponse.success(res, {
      statusCode: 201,
      message: 'Compra registrada correctamente',
      data: compra,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/compras/:id
 * Roles: admin
 * Solo compras en estado 'pendiente'.
 * Body: { detalles: [{ insumoId, cantidad, costoUnitario }] }
 */
const update = async (req, res, next) => {
  try {
    const compra = await compraService.updateCompra(req.params.id, req.body);
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Compra actualizada correctamente',
      data: compra,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/compras/:id/estado
 * Roles: admin
 * Body: { estado: 'recibido' | 'cancelado' | 'anulado' }
 *
 * Efectos sobre stock:
 *   pendiente → recibido  : suma stock de insumos
 *   recibido  → anulado   : resta stock (verifica que no quede negativo)
 *   otros                 : sin efecto en stock
 */
const cambiarEstado = async (req, res, next) => {
  try {
    const compra = await compraService.cambiarEstado(
      req.params.id,
      req.body.estado,
      req.usuario
    );
    return apiResponse.success(res, {
      statusCode: 200,
      message: `Estado de la compra actualizado a "${req.body.estado}"`,
      data: compra,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getById, create, update, cambiarEstado };
