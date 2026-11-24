'use strict';

const insumoService = require('./insumo.service');
const apiResponse   = require('../../helpers/apiResponse');

/**
 * GET /api/insumos
 * Query: ?search=&stockBajo=&page=&limit=
 * Roles: admin, socio
 */
const list = async (req, res, next) => {
  try {
    const { search, stockBajo, page, limit } = req.query;
    const result = await insumoService.listInsumos({ search, stockBajo, page, limit });

    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Insumos obtenidos correctamente',
      data: result.items,
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/insumos/:id
 * Roles: admin, socio
 */
const getById = async (req, res, next) => {
  try {
    const insumo = await insumoService.getInsumoById(req.params.id);
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Insumo obtenido correctamente',
      data: insumo,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/insumos
 * Roles: admin
 */
const create = async (req, res, next) => {
  try {
    const insumo = await insumoService.createInsumo(req.body);
    return apiResponse.success(res, {
      statusCode: 201,
      message: 'Insumo creado correctamente',
      data: insumo,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/insumos/:id
 * Roles: admin
 */
const update = async (req, res, next) => {
  try {
    const insumo = await insumoService.updateInsumo(req.params.id, req.body);
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Insumo actualizado correctamente',
      data: insumo,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/insumos/:id/stock
 * Ajuste manual de stock (entrada o salida administrativa).
 * Roles: admin
 *
 * Body: { cantidad: number, tipo: 'entrada' | 'salida' }
 */
const ajustarStock = async (req, res, next) => {
  try {
    const { cantidad, tipo } = req.body;
    const insumo = await insumoService.ajustarStock(req.params.id, cantidad, tipo);

    return apiResponse.success(res, {
      statusCode: 200,
      message: `Stock ajustado correctamente (${tipo})`,
      data: insumo,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/insumos/:id
 * Roles: admin
 */
const remove = async (req, res, next) => {
  try {
    const result = await insumoService.deleteInsumo(req.params.id);
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Insumo eliminado correctamente',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getById, create, update, ajustarStock, remove };
