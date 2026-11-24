'use strict';

const { body, param, query } = require('express-validator');
const { ESTADO_COMPRA }       = require('../../models/Compra');

/**
 * Regla compartida: array de detalles con insumoId, cantidad y costoUnitario.
 */
const detallesRule = body('detalles')
  .notEmpty().withMessage('Los detalles de la compra son requeridos')
  .isArray({ min: 1 }).withMessage('La compra debe tener al menos un insumo')
  .custom((detalles) => {
    for (const item of detalles) {
      if (!Number.isInteger(item.insumoId) || item.insumoId < 1) {
        throw new Error('Cada detalle requiere un insumoId entero positivo');
      }
      if (typeof item.cantidad !== 'number' || item.cantidad <= 0) {
        throw new Error('Cada detalle requiere una cantidad mayor a 0');
      }
      if (typeof item.costoUnitario !== 'number' || item.costoUnitario < 0) {
        throw new Error('Cada detalle requiere un costoUnitario mayor o igual a 0');
      }
    }
    // Verificar que no haya insumoId duplicados
    const ids = detalles.map((d) => d.insumoId);
    if (new Set(ids).size !== ids.length) {
      throw new Error('No puede haber insumos duplicados en la compra. Ajusta la cantidad en su lugar.');
    }
    return true;
  });

const createCompraRules = [
  body('proveedorId')
    .notEmpty().withMessage('El proveedorId es requerido')
    .isInt({ min: 1 }).withMessage('El proveedorId debe ser un entero positivo'),

  // Opcional: si falta se usa la sucursal del usuario.
  // El empleado NO se envía: se toma del token.
  body('sucursalId')
    .optional()
    .isInt({ min: 1 }).withMessage('El sucursalId debe ser un entero positivo'),

  detallesRule,
];

const updateCompraRules = [
  param('id')
    .isInt({ min: 1 }).withMessage('El id debe ser un entero positivo'),

  detallesRule,
];

const cambiarEstadoRules = [
  param('id')
    .isInt({ min: 1 }).withMessage('El id debe ser un entero positivo'),

  body('estado')
    .notEmpty().withMessage('El estado es requerido')
    .isIn(ESTADO_COMPRA).withMessage(
      `El estado debe ser uno de: ${ESTADO_COMPRA.join(', ')}`
    ),
];

const getByIdRules = [
  param('id')
    .isInt({ min: 1 }).withMessage('El id debe ser un entero positivo'),
];

const listRules = [
  query('sucursalId')
    .optional()
    .isInt({ min: 1 }).withMessage('sucursalId debe ser un entero positivo'),

  query('proveedorId')
    .optional()
    .isInt({ min: 1 }).withMessage('proveedorId debe ser un entero positivo'),

  query('empleadoId')
    .optional()
    .isInt({ min: 1 }).withMessage('empleadoId debe ser un entero positivo'),

  query('estado')
    .optional()
    .isIn(ESTADO_COMPRA).withMessage(
      `El estado debe ser uno de: ${ESTADO_COMPRA.join(', ')}`
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
  createCompraRules,
  updateCompraRules,
  cambiarEstadoRules,
  getByIdRules,
  listRules,
};
