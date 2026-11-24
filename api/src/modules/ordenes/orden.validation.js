'use strict';

const { body, param, query } = require('express-validator');
const { ESTADO_ORDEN }        = require('../../models/Orden');

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

const createOrdenRules = [
  body('clienteId')
    .notEmpty().withMessage('El clienteId es requerido')
    .isInt({ min: 1 }).withMessage('El clienteId debe ser un entero positivo'),

  body('sucursalId')
    .notEmpty().withMessage('El sucursalId es requerido')
    .isInt({ min: 1 }).withMessage('El sucursalId debe ser un entero positivo'),

  body('empleadoId')
    .notEmpty().withMessage('El empleadoId es requerido')
    .isInt({ min: 1 }).withMessage('El empleadoId debe ser un entero positivo'),

  detallesRule,
];

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
  getByIdRules,
  listRules,
};
