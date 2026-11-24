'use strict';

const { Op, fn, col, literal } = require('sequelize');
const { whereFechas, sqlFechaLocal } = require('../../helpers/dateRange');
const {
  Orden, DetalleOrden, Producto,
  Compra, DetalleCompra, Insumo,
  Sucursal, Cliente, Proveedor,
  sequelize,
} = require('../../config/db');

// Las fechas se interpretan en la zona horaria del negocio (APP_TIMEZONE).
const buildFechaWhere = whereFechas;

// ── Reportes de ventas ────────────────────────────────────────────────────────

/**
 * Resumen de ventas agrupado por sucursal.
 * Retorna: sucursalId, nombre, totalOrdenes, totalIngresos
 * Solo incluye órdenes completadas.
 */
const ventasPorSucursal = async ({ fechaDesde, fechaHasta, sucursalId } = {}) => {
  const where = {
    estado: 'completado',
    ...buildFechaWhere('fecha_de_orden', fechaDesde, fechaHasta),
  };
  if (sucursalId) where.sucursalId = sucursalId;

  return Orden.findAll({
    where,
    attributes: [
      'sucursalId',
      [fn('COUNT', col('Orden.id')),   'totalOrdenes'],
      [fn('SUM',   col('Orden.total')), 'totalIngresos'],
    ],
    include: [{ model: Sucursal, as: 'sucursal', attributes: ['nombre'] }],
    group: ['Orden.sucursal_id', 'sucursal.id'],
    order: [[literal('"totalIngresos"'), 'DESC']],
    raw: false,
  });
};

/**
 * Resumen de ventas consolidado (todas las sucursales).
 * Retorna: totalOrdenes, totalIngresos, ticketPromedio
 */
const ventasConsolidadas = async ({ fechaDesde, fechaHasta, sucursalId } = {}) => {
  const where = {
    estado: 'completado',
    ...buildFechaWhere('fecha_de_orden', fechaDesde, fechaHasta),
  };
  if (sucursalId) where.sucursalId = sucursalId;

  const result = await Orden.findOne({
    where,
    attributes: [
      [fn('COUNT', col('id')),    'totalOrdenes'],
      [fn('SUM',   col('total')), 'totalIngresos'],
      [fn('AVG',   col('total')), 'ticketPromedio'],
    ],
    raw: true,
  });

  return {
    totalOrdenes:  parseInt(result.totalOrdenes  || 0),
    totalIngresos: parseFloat(result.totalIngresos || 0).toFixed(2),
    ticketPromedio: parseFloat(result.ticketPromedio || 0).toFixed(2),
  };
};

/**
 * Productos más vendidos (por cantidad y por ingresos).
 */
const productosMasVendidos = async ({ fechaDesde, fechaHasta, sucursalId, limit = 10 } = {}) => {
  const whereOrden = {
    estado: 'completado',
    ...buildFechaWhere('fecha_de_orden', fechaDesde, fechaHasta),
  };
  if (sucursalId) whereOrden.sucursalId = sucursalId;

  return DetalleOrden.findAll({
    attributes: [
      'productoId',
      [fn('SUM', col('DetalleOrden.cantidad')),  'totalUnidades'],
      [fn('SUM', col('DetalleOrden.subtotal')),  'totalIngresos'],
    ],
    include: [
      { model: Producto, as: 'producto', attributes: ['nombre', 'precioVenta'] },
      {
        model: Orden,
        as: 'orden',
        attributes: [],
        where: whereOrden,
        required: true,
      },
    ],
    group: ['DetalleOrden.producto_id', 'producto.id'],
    order: [[literal('"totalUnidades"'), 'DESC']],
    limit,
    subQuery: false,
  });
};

/**
 * Ventas por período (día, semana o mes) para gráficas de tendencia.
 */
const ventasPorPeriodo = async ({ fechaDesde, fechaHasta, sucursalId, agrupacion = 'dia' } = {}) => {
  const where = {
    estado: 'completado',
    ...buildFechaWhere('fecha_de_orden', fechaDesde, fechaHasta),
  };
  if (sucursalId) where.sucursalId = sucursalId;

  const formatoSQL = {
    dia:  'YYYY-MM-DD',
    mes:  'YYYY-MM',
    anio: 'YYYY',
  }[agrupacion] || 'YYYY-MM-DD';

  return Orden.findAll({
    where,
    attributes: [
      [literal(`TO_CHAR(${sqlFechaLocal(sequelize, 'fecha_de_orden')}, '${formatoSQL}')`), 'periodo'],
      [fn('COUNT', col('id')),    'totalOrdenes'],
      [fn('SUM',   col('total')), 'totalIngresos'],
    ],
    group: [literal(`TO_CHAR(${sqlFechaLocal(sequelize, 'fecha_de_orden')}, '${formatoSQL}')`)],
    order: [[literal('periodo'), 'ASC']],
    raw: true,
  });
};

// ── Reportes de compras ───────────────────────────────────────────────────────

/**
 * Resumen de compras agrupado por sucursal.
 * Solo incluye compras recibidas.
 */
const comprasPorSucursal = async ({ fechaDesde, fechaHasta, sucursalId } = {}) => {
  const where = {
    estado: 'recibido',
    ...buildFechaWhere('fecha_de_compra', fechaDesde, fechaHasta),
  };
  if (sucursalId) where.sucursalId = sucursalId;

  return Compra.findAll({
    where,
    attributes: [
      'sucursalId',
      [fn('COUNT', col('Compra.id')),    'totalCompras'],
      [fn('SUM',   col('Compra.total')), 'totalEgresos'],
    ],
    include: [{ model: Sucursal, as: 'sucursal', attributes: ['nombre'] }],
    group: ['Compra.sucursal_id', 'sucursal.id'],
    order: [[literal('"totalEgresos"'), 'DESC']],
    raw: false,
  });
};

/**
 * Resumen de compras consolidado.
 */
const comprasConsolidadas = async ({ fechaDesde, fechaHasta, sucursalId } = {}) => {
  const where = {
    estado: 'recibido',
    ...buildFechaWhere('fecha_de_compra', fechaDesde, fechaHasta),
  };
  if (sucursalId) where.sucursalId = sucursalId;

  const result = await Compra.findOne({
    where,
    attributes: [
      [fn('COUNT', col('id')),    'totalCompras'],
      [fn('SUM',   col('total')), 'totalEgresos'],
      [fn('AVG',   col('total')), 'promedioCompra'],
    ],
    raw: true,
  });

  return {
    totalCompras:   parseInt(result.totalCompras   || 0),
    totalEgresos:   parseFloat(result.totalEgresos  || 0).toFixed(2),
    promedioCompra: parseFloat(result.promedioCompra || 0).toFixed(2),
  };
};

/**
 * Insumos más comprados (por cantidad y por costo).
 */
const insumosMasComprados = async ({ fechaDesde, fechaHasta, sucursalId, limit = 10 } = {}) => {
  const whereCompra = {
    estado: 'recibido',
    ...buildFechaWhere('fecha_de_compra', fechaDesde, fechaHasta),
  };
  if (sucursalId) whereCompra.sucursalId = sucursalId;

  return DetalleCompra.findAll({
    attributes: [
      'insumoId',
      [fn('SUM', col('DetalleCompra.cantidad')), 'totalCantidad'],
      [fn('SUM', col('DetalleCompra.subtotal')), 'totalEgresos'],
    ],
    include: [
      { model: Insumo, as: 'insumo', attributes: ['nombre', 'unidad'] },
      {
        model: Compra,
        as: 'compra',
        attributes: [],
        where: whereCompra,
        required: true,
      },
    ],
    group: ['DetalleCompra.insumo_id', 'insumo.id'],
    order: [[literal('"totalEgresos"'), 'DESC']],
    limit,
    subQuery: false,
  });
};

// ── Reporte consolidado (ingresos vs egresos) ─────────────────────────────────

/**
 * Balance consolidado: ingresos (ventas) vs egresos (compras).
 * Este es el reporte principal que cumple el requisito de
 * "totalizar todos los ingresos y egresos como si fuera uno solo".
 *
 * Puede filtrarse por sucursal o consultarse global.
 */
const balanceConsolidado = async ({ fechaDesde, fechaHasta, sucursalId } = {}) => {
  const [ventas, compras] = await Promise.all([
    ventasConsolidadas({ fechaDesde, fechaHasta, sucursalId }),
    comprasConsolidadas({ fechaDesde, fechaHasta, sucursalId }),
  ]);

  const totalIngresos = parseFloat(ventas.totalIngresos);
  const totalEgresos  = parseFloat(compras.totalEgresos);
  const balance       = totalIngresos - totalEgresos;

  return {
    periodo: { fechaDesde: fechaDesde || null, fechaHasta: fechaHasta || null },
    sucursalId: sucursalId || null,
    ventas: {
      totalOrdenes:   ventas.totalOrdenes,
      totalIngresos,
      ticketPromedio: parseFloat(ventas.ticketPromedio),
    },
    compras: {
      totalCompras:   compras.totalCompras,
      totalEgresos,
      promedioCompra: parseFloat(compras.promedioCompra),
    },
    balance: {
      bruto:      parseFloat(balance.toFixed(2)),
      positivo:   balance >= 0,
    },
  };
};

/**
 * Balance por sucursal (todas las sucursales en una sola respuesta).
 */
const balancePorSucursal = async ({ fechaDesde, fechaHasta } = {}) => {
  const [ventas, compras, sucursales] = await Promise.all([
    ventasPorSucursal({ fechaDesde, fechaHasta }),
    comprasPorSucursal({ fechaDesde, fechaHasta }),
    Sucursal.findAll({ where: { activo: true }, attributes: ['id', 'nombre'] }),
  ]);

  // Indexar por sucursalId
  const mapaVentas   = Object.fromEntries(ventas.map((v) => [v.sucursalId, v]));
  const mapaCompras  = Object.fromEntries(compras.map((c) => [c.sucursalId, c]));

  return sucursales.map((s) => {
    const v = mapaVentas[s.id];
    const c = mapaCompras[s.id];

    const totalIngresos = parseFloat(v?.dataValues?.totalIngresos || 0);
    const totalEgresos  = parseFloat(c?.dataValues?.totalEgresos  || 0);

    return {
      sucursalId:     s.id,
      nombre:         s.nombre,
      totalOrdenes:   parseInt(v?.dataValues?.totalOrdenes  || 0),
      totalCompras:   parseInt(c?.dataValues?.totalCompras  || 0),
      totalIngresos:  parseFloat(totalIngresos.toFixed(2)),
      totalEgresos:   parseFloat(totalEgresos.toFixed(2)),
      balance:        parseFloat((totalIngresos - totalEgresos).toFixed(2)),
    };
  });
};

module.exports = {
  sequelize,
  ventasPorSucursal,
  ventasConsolidadas,
  productosMasVendidos,
  ventasPorPeriodo,
  comprasPorSucursal,
  comprasConsolidadas,
  insumosMasComprados,
  balanceConsolidado,
  balancePorSucursal,
};
