'use strict';

const sucursalService = require('./sucursal.service');
const apiResponse     = require('../../helpers/apiResponse');

/**
 * GET /api/sucursales
 * Query: ?search=&activo=&page=&limit=
 * Roles: admin, socio
 */
const list = async (req, res, next) => {
  try {
    const { search, activo, page, limit } = req.query;
    const result = await sucursalService.listSucursales({ search, activo, page, limit });

    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Sucursales obtenidas correctamente',
      data: result.items,
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/sucursales/:id
 * Roles: admin, socio
 */
const getById = async (req, res, next) => {
  try {
    const sucursal = await sucursalService.getSucursalById(req.params.id);
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Sucursal obtenida correctamente',
      data: sucursal,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/sucursales
 * Roles: admin
 */
const create = async (req, res, next) => {
  try {
    const sucursal = await sucursalService.createSucursal(req.body);
    return apiResponse.success(res, {
      statusCode: 201,
      message: 'Sucursal creada correctamente',
      data: sucursal,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/sucursales/:id
 * Roles: admin
 */
const update = async (req, res, next) => {
  try {
    const sucursal = await sucursalService.updateSucursal(req.params.id, req.body);
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Sucursal actualizada correctamente',
      data: sucursal,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/sucursales/:id
 * Roles: admin
 */
const remove = async (req, res, next) => {
  try {
    const result = await sucursalService.deleteSucursal(req.params.id);
    return apiResponse.success(res, {
      statusCode: 200,
      message: result.eliminado
        ? 'Sucursal eliminada correctamente'
        : 'La sucursal tiene historial y fue desactivada en lugar de eliminada',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getById, create, update, remove };
