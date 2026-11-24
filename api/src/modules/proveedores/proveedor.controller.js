'use strict';

const proveedorService = require('./proveedor.service');
const apiResponse      = require('../../helpers/apiResponse');

/**
 * GET /api/proveedores
 * Query: ?search=&page=&limit=
 * Roles: admin, socio
 */
const list = async (req, res, next) => {
  try {
    const { search, page, limit } = req.query;
    const result = await proveedorService.listProveedores({ search, page, limit });

    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Proveedores obtenidos correctamente',
      data: result.items,
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/proveedores/:id
 * Roles: admin, socio
 */
const getById = async (req, res, next) => {
  try {
    const proveedor = await proveedorService.getProveedorById(req.params.id);
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Proveedor obtenido correctamente',
      data: proveedor,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/proveedores
 * Roles: admin
 */
const create = async (req, res, next) => {
  try {
    const proveedor = await proveedorService.createProveedor(req.body);
    return apiResponse.success(res, {
      statusCode: 201,
      message: 'Proveedor creado correctamente',
      data: proveedor,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/proveedores/:id
 * Roles: admin
 */
const update = async (req, res, next) => {
  try {
    const proveedor = await proveedorService.updateProveedor(req.params.id, req.body);
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Proveedor actualizado correctamente',
      data: proveedor,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/proveedores/:id
 * Roles: admin
 */
const remove = async (req, res, next) => {
  try {
    const result = await proveedorService.deleteProveedor(req.params.id);
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Proveedor eliminado correctamente',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getById, create, update, remove };
