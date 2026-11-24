'use strict';

const reporteService = require('./reporte.service');
const apiResponse    = require('../../helpers/apiResponse');

/**
 * GET /api/reportes/ventas/sucursales
 * Ventas agrupadas por sucursal.
 * Query: ?fechaDesde=&fechaHasta=&sucursalId=
 * Roles: admin, socio
 */
const ventasPorSucursal = async (req, res, next) => {
  try {
    const data = await reporteService.reporteVentasPorSucursal(req.query);
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Reporte de ventas por sucursal obtenido correctamente',
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reportes/ventas/consolidado
 * Totales de ventas de todo el restaurante.
 * Query: ?fechaDesde=&fechaHasta=
 * Roles: admin, socio
 */
const ventasConsolidadas = async (req, res, next) => {
  try {
    const data = await reporteService.reporteVentasConsolidadas(req.query);
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Reporte de ventas consolidado obtenido correctamente',
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reportes/ventas/productos
 * Productos más vendidos.
 * Query: ?fechaDesde=&fechaHasta=&sucursalId=&limit=
 * Roles: admin, socio
 */
const productosMasVendidos = async (req, res, next) => {
  try {
    const data = await reporteService.reporteProductosMasVendidos(req.query);
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Reporte de productos más vendidos obtenido correctamente',
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reportes/ventas/tendencia
 * Tendencia de ventas agrupada por día, mes o año.
 * Query: ?fechaDesde=&fechaHasta=&sucursalId=&agrupacion=dia|mes|anio
 * Roles: admin, socio
 */
const ventasPorPeriodo = async (req, res, next) => {
  try {
    const data = await reporteService.reporteVentasPorPeriodo(req.query);
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Reporte de tendencia de ventas obtenido correctamente',
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reportes/compras/sucursales
 * Compras agrupadas por sucursal.
 * Query: ?fechaDesde=&fechaHasta=&sucursalId=
 * Roles: admin, socio
 */
const comprasPorSucursal = async (req, res, next) => {
  try {
    const data = await reporteService.reporteComprasPorSucursal(req.query);
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Reporte de compras por sucursal obtenido correctamente',
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reportes/compras/consolidado
 * Totales de compras de todo el restaurante.
 * Query: ?fechaDesde=&fechaHasta=
 * Roles: admin, socio
 */
const comprasConsolidadas = async (req, res, next) => {
  try {
    const data = await reporteService.reporteComprasConsolidadas(req.query);
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Reporte de compras consolidado obtenido correctamente',
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reportes/compras/insumos
 * Insumos más comprados (ranking por egreso).
 * Query: ?fechaDesde=&fechaHasta=&sucursalId=&limit=
 * Roles: admin, socio
 */
const insumosMasComprados = async (req, res, next) => {
  try {
    const data = await reporteService.reporteInsumosMasComprados(req.query);
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Reporte de insumos más comprados obtenido correctamente',
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reportes/balance
 * Balance consolidado: ingresos vs egresos.
 * Sin sucursalId → global. Con sucursalId → esa sucursal.
 * Query: ?fechaDesde=&fechaHasta=&sucursalId=
 * Roles: admin, socio
 */
const balance = async (req, res, next) => {
  try {
    const data = await reporteService.reporteBalance(req.query);
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Balance obtenido correctamente',
      data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/reportes/balance/sucursales
 * Balance desglosado por cada sucursal activa.
 * Query: ?fechaDesde=&fechaHasta=
 * Roles: admin, socio
 */
const balancePorSucursal = async (req, res, next) => {
  try {
    const data = await reporteService.reporteBalancePorSucursal(req.query);
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Balance por sucursal obtenido correctamente',
      data,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  ventasPorSucursal,
  ventasConsolidadas,
  productosMasVendidos,
  ventasPorPeriodo,
  comprasPorSucursal,
  comprasConsolidadas,
  insumosMasComprados,
  balance,
  balancePorSucursal,
};
