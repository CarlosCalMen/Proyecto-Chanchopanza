'use strict';

const { body, param, query } = require('express-validator');
const { ESTADO_ORDEN }        = require('../../models/Orden');
const { METODOS_PAGO }        = require('../../models/Pago');

/**
 * Regla compartida: array de detalles con productoId y cantidad.
 */
const detallesRule = body('detalles')
  .notEmpty().withMessage('Los detalles de la orden son requeridos')
  .isArray({ min: 1 }).withMessage('La orden debe tener al menos un producto')
  .custom((detalles) => {
    for (const item of detalles) {
      if (!Number.isInteger(item.productoId) || item.productoId < 1) {
        throw new Error('Cada detalle requiere un productoId entero positivo');
      }
      if (!Number.isInteger(item.cantidad) || item.cantidad < 1) {
        throw new Error('Cada detalle requiere una cantidad entera mayor a 0');
      }
    }
    // Verificar que no haya productoId duplicados en la misma orden
    const ids = detalles.map((d) => d.productoId);
    if (new Set(ids).size !== ids.length) {
      throw new Error('No puede haber productos duplicados en la orden. Ajusta la cantidad en su lugar.');
    }
    return true;
  });

const updateOrdenRules = [
  param('id')
    .isInt({ min: 1 }).withMessage('El id debe ser un entero positivo'),

  detallesRule,
];

const cambiarEstadoRules = [
  param('id')
    .isInt({ min: 1 }).withMessage('El id debe ser un entero positivo'),

  body('estado')
    .notEmpty().withMessage('El estado es requerido')
    .isIn(ESTADO_ORDEN).withMessage(
      `El estado debe ser uno de: ${ESTADO_ORDEN.join(', ')}`
    ),
];

const MAX_PAGOS = 10;

// Importes con máximo 2 decimales
const dosDecimales = (v) => Math.round(Number(v) * 100) / 100 === Number(v);

// O se envía "pagos" (cobro dividido) o "metodoPago" (pago único), nunca ambos
const exclusividadPagos = body().custom((b) => {
  const tienePagos = b.pagos !== undefined;
  const tieneUnico = b.metodoPago !== undefined || b.montoRecibido !== undefined;
  if (tienePagos && tieneUnico) {
    throw new Error('Envía "pagos" (cobro dividido) o "metodoPago" (pago único), no ambos');
  }
  if (!tienePagos && b.metodoPago === undefined && b.montoRecibido !== undefined) {
    throw new Error('"montoRecibido" requiere "metodoPago"');
  }
  return true;
});

// Para el endpoint de cobro, enviar uno de los dos formatos es obligatorio
const exigePago = body().custom((b) => {
  if (b.pagos === undefined && b.metodoPago === undefined) {
    throw new Error('Envía "pagos" (lista de pagos) o "metodoPago" (pago único)');
  }
  return true;
});

// Campos del cobro (se reutilizan al cobrar y al crear la orden con cobro)
const camposPago = [
  // ── Cobro dividido ──
  body('pagos')
    .optional()
    .isArray({ min: 1, max: MAX_PAGOS })
    .withMessage(`pagos debe ser una lista de 1 a ${MAX_PAGOS} pagos`),

  body('pagos.*.metodoPago')
    .isIn(METODOS_PAGO).withMessage(`El metodoPago debe ser uno de: ${METODOS_PAGO.join(', ')}`),

  body('pagos.*.monto')
    .isFloat({ gt: 0 }).withMessage('El monto debe ser un número mayor a 0')
    .bail()
    .custom(dosDecimales).withMessage('El monto admite como máximo 2 decimales'),

  body('pagos.*.montoRecibido')
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('El montoRecibido debe ser un número mayor o igual a 0')
    .bail()
    .custom(dosDecimales).withMessage('El montoRecibido admite como máximo 2 decimales'),

  // ── Pago único (formato anterior) ──
  body('metodoPago')
    .optional()
    .isIn(METODOS_PAGO).withMessage(`El metodoPago debe ser uno de: ${METODOS_PAGO.join(', ')}`),

  body('montoRecibido')
    .optional()
    .isFloat({ min: 0 }).withMessage('El montoRecibido debe ser un número mayor o igual a 0')
    .bail()
    .custom(dosDecimales).withMessage('El montoRecibido admite como máximo 2 decimales'),
];

const pagoRules = [
  param('id')
    .isInt({ min: 1 }).withMessage('El id debe ser un entero positivo'),
  exclusividadPagos,
  exigePago,
  ...camposPago,
];

const createOrdenRules = [
  // Opcional: sin clienteId la venta es al cliente mostrador ('Cliente Rápido')
  body('clienteId')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('El clienteId debe ser un entero positivo'),

  // Opcional: el cajero siempre usa su sucursal; el admin puede elegir otra.
  // El empleado NO se envía: se toma del token.
  body('sucursalId')
    .optional()
    .isInt({ min: 1 }).withMessage('El sucursalId debe ser un entero positivo'),

  detallesRule,

  // Opcional: cobrar en la misma operación (mismo formato que POST /ordenes/:id/pago)
  exclusividadPagos,
  ...camposPago,
];

const getByIdRules = [
  param('id')
    .isInt({ min: 1 }).withMessage('El id debe ser un entero positivo'),
];

const listRules = [
  query('sucursalId')
    .optional()
    .isInt({ min: 1 }).withMessage('sucursalId debe ser un entero positivo'),

  query('clienteId')
    .optional()
    .isInt({ min: 1 }).withMessage('clienteId debe ser un entero positivo'),

  query('empleadoId')
    .optional()
    .isInt({ min: 1 }).withMessage('empleadoId debe ser un entero positivo'),

  query('estado')
    .optional()
    .isIn(ESTADO_ORDEN).withMessage(
      `El estado debe ser uno de: ${ESTADO_ORDEN.join(', ')}`
    ),

  query('fechaDesde')
    .optional()
    .isDate().withMessage('fechaDesde debe ser una fecha válida (YYYY-MM-DD)'),

  query('fechaHasta')
    .optional()
    .isDate().withMessage('fechaHasta debe ser una fecha válida (YYYY-MM-DD)')
    .custom((fechaHasta, { req }) => {
      if (req.query.fechaDesde && fechaHasta < req.query.fechaDesde) {
        throw new Error('fechaHasta no puede ser anterior a fechaDesde');
      }
      return true;
    }),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page debe ser un entero positivo'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit debe estar entre 1 y 100'),
];

module.exports = {
  createOrdenRules,
  updateOrdenRules,
  cambiarEstadoRules,
  pagoRules,
  getByIdRules,
  listRules,
};
