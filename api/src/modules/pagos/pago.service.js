'use strict';

const pagoRepository = require('./pago.repository');
const AppError       = require('../../helpers/AppError');
const { METODOS_PAGO, ESTADO_PAGO } = require('../../models/Pago');

const DEFAULT_LIMIT = 20;

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Normaliza filtros y aplica la restricción del cajero:
 * solo ve SUS cobros, en SU sucursal (es su "cierre de caja").
 */
const prepararFiltros = (query, usuario) => {
  const { fechaDesde, fechaHasta, metodoPago, estado } = query;

  if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
    throw new AppError('fechaHasta no puede ser anterior a fechaDesde', 422);
  }
  if (metodoPago && !METODOS_PAGO.includes(metodoPago)) {
    throw new AppError(`metodoPago inválido. Valores permitidos: ${METODOS_PAGO.join(', ')}`, 422);
  }
  if (estado && !ESTADO_PAGO.includes(estado)) {
    throw new AppError(`estado inválido. Valores permitidos: ${ESTADO_PAGO.join(', ')}`, 422);
  }

  let sucursalId = query.sucursalId ? parseInt(query.sucursalId, 10) : undefined;
  let empleadoId = query.empleadoId ? parseInt(query.empleadoId, 10) : undefined;

  if (usuario.rol === 'caja') {
    if (!usuario.empleadoId) {
      throw new AppError('Tu usuario no tiene un empleado asociado', 409);
    }
    sucursalId = usuario.sucursalId;
    empleadoId = usuario.empleadoId;
  }

  return { sucursalId, empleadoId, metodoPago, estado, fechaDesde, fechaHasta };
};

const listPagos = async (query, usuario) => {
  const filtros = prepararFiltros(query, usuario);

  const parsedPage  = Math.max(parseInt(query.page,  10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(query.limit, 10) || DEFAULT_LIMIT, 1), 100);
  const offset      = (parsedPage - 1) * parsedLimit;

  const { rows, count } = await pagoRepository.findAll({ ...filtros, limit: parsedLimit, offset });

  return {
    items: rows,
    meta: {
      total:      count,
      page:       parsedPage,
      limit:      parsedLimit,
      totalPages: Math.ceil(count / parsedLimit),
    },
  };
};

/**
 * Resumen de cobros vigentes por método de pago (base del cierre de caja).
 */
const resumenPagos = async (query, usuario) => {
  const { estado, ...filtros } = prepararFiltros(query, usuario); // 'estado' no aplica: solo vigentes
  const filas = await pagoRepository.resumenPorMetodo(filtros);

  const metodos = filas.map((f) => ({
    metodoPago: f.metodoPago,
    cantidad:   parseInt(f.cantidad, 10),
    total:      round2(parseFloat(f.total)),
  }));

  return {
    filtros: {
      fechaDesde: filtros.fechaDesde || null,
      fechaHasta: filtros.fechaHasta || null,
      sucursalId: filtros.sucursalId || null,
      empleadoId: filtros.empleadoId || null,
    },
    metodos,
    cantidadCobros: metodos.reduce((s, m) => s + m.cantidad, 0),
    totalCobrado:   round2(metodos.reduce((s, m) => s + m.total, 0)),
  };
};

module.exports = { listPagos, resumenPagos };
