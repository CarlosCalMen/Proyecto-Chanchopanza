'use strict';

const productoService = require('./product.service');
const apiResponse     = require('../../helpers/apiResponse');

/**
 * GET /api/productos
 * Query: ?search=&activo=&page=&limit=
 * Roles: admin, socio, caja
 */
const list = async (req, res, next) => {
  try {
    const { search, activo, page, limit } = req.query;
    const result = await productoService.listProductos({ search, activo, page, limit });

    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Productos obtenidos correctamente',
      data: result.items,
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/productos/:id
 * Roles: admin, socio, caja
 */
const getById = async (req, res, next) => {
  try {
    const producto = await productoService.getProductoById(req.params.id);
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Producto obtenido correctamente',
      data: producto,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/productos
 * Roles: admin
 */
const create = async (req, res, next) => {
  try {
    const producto = await productoService.createProducto(req.body);
    return apiResponse.success(res, {
      statusCode: 201,
      message: 'Producto creado correctamente',
      data: producto,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/productos/:id
 * Roles: admin
 */
const update = async (req, res, next) => {
  try {
    const producto = await productoService.updateProducto(req.params.id, req.body);
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Producto actualizado correctamente',
      data: producto,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/productos/:id
 * Roles: admin
 *
 * Retorna si el producto fue eliminado físicamente o solo desactivado
 * (desactivado cuando tiene referencias en historial de órdenes).
 */
const remove = async (req, res, next) => {
  try {
    const result = await productoService.deleteProducto(req.params.id);
    return apiResponse.success(res, {
      statusCode: 200,
      message: result.eliminado
        ? 'Producto eliminado correctamente'
        : 'El producto tiene historial de ventas y fue desactivado en lugar de eliminado',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getById, create, update, remove };
