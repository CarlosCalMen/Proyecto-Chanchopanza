'use strict';

const { query } = require('express-validator');

/**
 * Reglas comunes reutilizables en todos los reportes.
 */
const fechasRules = [
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
];

const sucursalRule = query('sucursalId')
  .optional()
  .isInt({ min: 1 }).withMessage('sucursalId debe ser un entero positivo');

const limitRule = query('limit')
  .optional()
  .isInt({ min: 1, max: 50 }).withMessage('limit debe estar entre 1 y 50');

// ── Conjuntos de reglas por endpoint ─────────────────────────────────────────

const ventasPorSucursalRules    = [...fechasRules, sucursalRule];
const ventasConsolidasRules     = [...fechasRules];
const productosMasVendidosRules = [...fechasRules, sucursalRule, limitRule];

const ventasPorPeriodoRules = [
  ...fechasRules,
  sucursalRule,
  query('agrupacion')
    .optional()
    .isIn(['dia', 'mes', 'anio'])
    .withMessage('agrupacion debe ser "dia", "mes" o "anio"'),
];

const comprasPorSucursalRules    = [...fechasRules, sucursalRule];
const comprasConsolidasRules     = [...fechasRules];
const insumosMasCompradosRules   = [...fechasRules, sucursalRule, limitRule];
const balanceRules               = [...fechasRules, sucursalRule];
const balancePorSucursalRules    = [...fechasRules];

module.exports = {
  ventasPorSucursalRules,
  ventasConsolidasRules,
  productosMasVendidosRules,
  ventasPorPeriodoRules,
  comprasPorSucursalRules,
  comprasConsolidasRules,
  insumosMasCompradosRules,
  balanceRules,
  balancePorSucursalRules,
};
