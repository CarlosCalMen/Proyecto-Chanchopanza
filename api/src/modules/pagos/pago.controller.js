'use strict';

const pagoService = require('./pago.service');
const apiResponse = require('../../helpers/apiResponse');

/**
 * GET /api/pagos
 * Query: ?sucursalId=&empleadoId=&metodoPago=&estado=&fechaDesde=&fechaHasta=&page=&limit=
 * Roles: admin, socio (todo) | caja (solo sus cobros en su sucursal)
 */
const list = async (req, res, next) => {
  try {
    const result = await pagoService.listPagos(req.query, req.usuario);
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Cobros obtenidos correctamente',
      data: result.items,
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/pagos/resumen
 * Totales de cobros vigentes por método de pago (cierre de caja).
 * Query: ?sucursalId=&empleadoId=&metodoPago=&fechaDesde=&fechaHasta=
 */
const resumen = async (req, res, next) => {
  try {
    const data = await pagoService.resumenPagos(req.query, req.usuario);
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Resumen de cobros obtenido correctamente',
      data,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, resumen };
