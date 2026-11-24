'use strict';

const { Router } = require('express');

const reporteController  = require('./reporte.controller');
const validation          = require('./reporte.validation');
const validateMiddleware  = require('../../middlewares/validate.middleware');
const authMiddleware      = require('../../middlewares/auth.middleware');
const roleMiddleware      = require('../../middlewares/role.middleware');

const router = Router();

// Todas las rutas requieren token válido
// Solo admin y socio tienen acceso — el cajero no ve reportes
router.use(authMiddleware);
router.use(roleMiddleware('admin', 'socio'));

// ── Reportes de ventas ────────────────────────────────────────────────────────

/**
 * GET /api/reportes/ventas/sucursales
 * Ventas agrupadas por sucursal (órdenes completadas).
 * Query: ?fechaDesde=YYYY-MM-DD &fechaHasta=YYYY-MM-DD &sucursalId=
 */
router.get(
  '/ventas/sucursales',
  validation.ventasPorSucursalRules,
  validateMiddleware,
  reporteController.ventasPorSucursal
);

/**
 * GET /api/reportes/ventas/consolidado
 * Totales de ventas de todas las sucursales combinadas.
 * Query: ?fechaDesde= &fechaHasta=
 */
router.get(
  '/ventas/consolidado',
  validation.ventasConsolidasRules,
  validateMiddleware,
  reporteController.ventasConsolidadas
);

/**
 * GET /api/reportes/ventas/productos
 * Ranking de productos más vendidos por cantidad e ingresos.
 * Query: ?fechaDesde= &fechaHasta= &sucursalId= &limit=
 */
router.get(
  '/ventas/productos',
  validation.productosMasVendidosRules,
  validateMiddleware,
  reporteController.productosMasVendidos
);

/**
 * GET /api/reportes/ventas/tendencia
 * Evolución de ventas agrupada por día, mes o año.
 * Query: ?fechaDesde= &fechaHasta= &sucursalId= &agrupacion=dia|mes|anio
 */
router.get(
  '/ventas/tendencia',
  validation.ventasPorPeriodoRules,
  validateMiddleware,
  reporteController.ventasPorPeriodo
);

// ── Reportes de compras ───────────────────────────────────────────────────────

/**
 * GET /api/reportes/compras/sucursales
 * Compras agrupadas por sucursal (compras recibidas).
 * Query: ?fechaDesde= &fechaHasta= &sucursalId=
 */
router.get(
  '/compras/sucursales',
  validation.comprasPorSucursalRules,
  validateMiddleware,
  reporteController.comprasPorSucursal
);

/**
 * GET /api/reportes/compras/consolidado
 * Totales de compras de todas las sucursales combinadas.
 * Query: ?fechaDesde= &fechaHasta=
 */
router.get(
  '/compras/consolidado',
  validation.comprasConsolidasRules,
  validateMiddleware,
  reporteController.comprasConsolidadas
);

/**
 * GET /api/reportes/compras/insumos
 * Ranking de insumos más comprados por costo total.
 * Query: ?fechaDesde= &fechaHasta= &sucursalId= &limit=
 */
router.get(
  '/compras/insumos',
  validation.insumosMasCompradosRules,
  validateMiddleware,
  reporteController.insumosMasComprados
);

// ── Balance consolidado ───────────────────────────────────────────────────────

/**
 * GET /api/reportes/balance
 * Balance de ingresos vs egresos.
 * Sin sucursalId → global (todas las sucursales como una sola).
 * Con sucursalId → solo esa sucursal.
 * Query: ?fechaDesde= &fechaHasta= &sucursalId=
 */
router.get(
  '/balance',
  validation.balanceRules,
  validateMiddleware,
  reporteController.balance
);

/**
 * GET /api/reportes/balance/sucursales
 * Balance individual de cada sucursal activa en una sola respuesta.
 * Query: ?fechaDesde= &fechaHasta=
 */
router.get(
  '/balance/sucursales',
  validation.balancePorSucursalRules,
  validateMiddleware,
  reporteController.balancePorSucursal
);

module.exports = router;
