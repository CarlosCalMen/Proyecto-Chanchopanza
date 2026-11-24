'use strict';

const clienteService = require('./cliente.service');
const apiResponse    = require('../../helpers/apiResponse');

/**
 * GET /api/clientes
 * Query: ?search=&page=&limit=
 * Roles: admin, socio, caja
 */
const list = async (req, res, next) => {
  try {
    const { search, page, limit } = req.query;
    const result = await clienteService.listClientes({ search, page, limit });

    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Clientes obtenidos correctamente',
      data: result.items,
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/clientes/:id
 * Roles: admin, socio, caja
 */
const getById = async (req, res, next) => {
  try {
    const cliente = await clienteService.getClienteById(req.params.id);
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Cliente obtenido correctamente',
      data: cliente,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/clientes
 * Roles: admin, caja
 * El cajero puede registrar un cliente nuevo al momento de crear una orden.
 */
const create = async (req, res, next) => {
  try {
    const cliente = await clienteService.createCliente(req.body);
    return apiResponse.success(res, {
      statusCode: 201,
      message: 'Cliente creado correctamente',
      data: cliente,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/clientes/:id
 * Roles: admin, caja
 */
const update = async (req, res, next) => {
  try {
    const cliente = await clienteService.updateCliente(req.params.id, req.body);
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Cliente actualizado correctamente',
      data: cliente,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/clientes/:id
 * Roles: admin
 */
const remove = async (req, res, next) => {
  try {
    const result = await clienteService.deleteCliente(req.params.id);
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Cliente eliminado correctamente',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getById, create, update, remove };
