'use strict';

const reporteRepository = require('./reporte.repository');
const AppError          = require('../../helpers/AppError');

const AGRUPACIONES_VALIDAS = ['dia', 'mes', 'anio'];

// ── Helper: parseo y validación de parámetros comunes ─────────────────────────

const parsearFiltros = ({ fechaDesde, fechaHasta, sucursalId, limit } = {}) => {
  if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
    throw new AppError('fechaHasta no puede ser anterior a fechaDesde', 422);
  }

  return {
    fechaDesde:  fechaDesde  || undefined,
    fechaHasta:  fechaHasta  || undefined,
    sucursalId:  sucursalId  ? parseInt(sucursalId)  : undefined,
    limit:       limit       ? Math.min(parseInt(limit), 50) : 10,
  };
};

// ── Reportes de ventas ────────────────────────────────────────────────────────

/**
 * Ventas agrupadas por sucursal.
 * admin/socio pueden ver todas; si pasan sucursalId, filtra por ella.
 */
const reporteVentasPorSucursal = async (filtros) => {
  const { fechaDesde, fechaHasta, sucursalId } = parsearFiltros(filtros);
  return reporteRepository.ventasPorSucursal({ fechaDesde, fechaHasta, sucursalId });
};

/**
 * Ventas consolidadas de todo el restaurante.
 */
const reporteVentasConsolidadas = async (filtros) => {
  const { fechaDesde, fechaHasta } = parsearFiltros(filtros);
  return reporteRepository.ventasConsolidadas({ fechaDesde, fechaHasta });
};

/**
 * Productos más vendidos (ranking).
 */
const reporteProductosMasVendidos = async (filtros) => {
  const { fechaDesde, fechaHasta, sucursalId, limit } = parsearFiltros(filtros);
  return reporteRepository.productosMasVendidos({ fechaDesde, fechaHasta, sucursalId, limit });
};

/**
 * Tendencia de ventas por período (día / mes / año).
 */
const reporteVentasPorPeriodo = async (filtros) => {
  const { fechaDesde, fechaHasta, sucursalId } = parsearFiltros(filtros);
  const agrupacion = filtros.agrupacion || 'dia';

  if (!AGRUPACIONES_VALIDAS.includes(agrupacion)) {
    throw new AppError(
      `Agrupación inválida. Valores permitidos: ${AGRUPACIONES_VALIDAS.join(', ')}`,
      422
    );
  }

  return reporteRepository.ventasPorPeriodo({ fechaDesde, fechaHasta, sucursalId, agrupacion });
};

// ── Reportes de compras ───────────────────────────────────────────────────────

/**
 * Compras agrupadas por sucursal.
 */
const reporteComprasPorSucursal = async (filtros) => {
  const { fechaDesde, fechaHasta, sucursalId } = parsearFiltros(filtros);
  return reporteRepository.comprasPorSucursal({ fechaDesde, fechaHasta, sucursalId });
};

/**
 * Compras consolidadas de todo el restaurante.
 */
const reporteComprasConsolidadas = async (filtros) => {
  const { fechaDesde, fechaHasta } = parsearFiltros(filtros);
  return reporteRepository.comprasConsolidadas({ fechaDesde, fechaHasta });
};

/**
 * Insumos más comprados (ranking de egresos por insumo).
 */
const reporteInsumosMasComprados = async (filtros) => {
  const { fechaDesde, fechaHasta, sucursalId, limit } = parsearFiltros(filtros);
  return reporteRepository.insumosMasComprados({ fechaDesde, fechaHasta, sucursalId, limit });
};

// ── Reporte consolidado ───────────────────────────────────────────────────────

/**
 * Balance consolidado: ingresos vs egresos.
 *
 * Sin sucursalId → balance global de todas las sucursales.
 * Con sucursalId → balance de esa sucursal específica.
 *
 * Este es el reporte principal del sistema:
 * permite ver el negocio completo o por sucursal
 * con una sola llamada.
 */
const reporteBalance = async (filtros) => {
  const { fechaDesde, fechaHasta, sucursalId } = parsearFiltros(filtros);
  return reporteRepository.balanceConsolidado({ fechaDesde, fechaHasta, sucursalId });
};

/**
 * Balance desglosado por cada sucursal.
 * Siempre global — no acepta filtro por sucursal.
 */
const reporteBalancePorSucursal = async (filtros) => {
  const { fechaDesde, fechaHasta } = parsearFiltros(filtros);
  return reporteRepository.balancePorSucursal({ fechaDesde, fechaHasta });
};

module.exports = {
  reporteVentasPorSucursal,
  reporteVentasConsolidadas,
  reporteProductosMasVendidos,
  reporteVentasPorPeriodo,
  reporteComprasPorSucursal,
  reporteComprasConsolidadas,
  reporteInsumosMasComprados,
  reporteBalance,
  reporteBalancePorSucursal,
};
