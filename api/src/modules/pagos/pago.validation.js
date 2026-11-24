'use strict';

const { query }                       = require('express-validator');
const { METODOS_PAGO, ESTADO_PAGO }   = require('../../models/Pago');

const filtrosRules = [
  query('sucursalId').optional().isInt({ min: 1 }).withMessage('sucursalId debe ser un entero positivo'),
  query('empleadoId').optional().isInt({ min: 1 }).withMessage('empleadoId debe ser un entero positivo'),
  query('metodoPago').optional().isIn(METODOS_PAGO)
    .withMessage(`metodoPago debe ser uno de: ${METODOS_PAGO.join(', ')}`),
  query('fechaDesde').optional().isDate().withMessage('fechaDesde debe ser una fecha válida (YYYY-MM-DD)'),
  query('fechaHasta').optional().isDate().withMessage('fechaHasta debe ser una fecha válida (YYYY-MM-DD)')
    .custom((fechaHasta, { req }) => {
      if (req.query.fechaDesde && fechaHasta < req.query.fechaDesde) {
        throw new Error('fechaHasta no puede ser anterior a fechaDesde');
      }
      return true;
    }),
];

const listRules = [
  ...filtrosRules,
  query('estado').optional().isIn(ESTADO_PAGO).withMessage(`estado debe ser uno de: ${ESTADO_PAGO.join(', ')}`),
  query('page').optional().isInt({ min: 1 }).withMessage('page debe ser un entero positivo'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit debe estar entre 1 y 100'),
];

const resumenRules = [...filtrosRules];

module.exports = { listRules, resumenRules };
