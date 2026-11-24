'use strict';

const { body, param, query } = require('express-validator');

/**
 * Regla compartida: array de insumos (receta), usada en create y update.
 */
const insumosRule = body('insumos')
  .optional()
  .isArray().withMessage('insumos debe ser un array')
  .custom((insumos) => {
    if (!Array.isArray(insumos)) return true;
    for (const entry of insumos) {
      if (typeof entry !== 'object' || entry === null) {
        throw new Error('Cada entrada de insumo debe ser un objeto');
      }
      if (!Number.isInteger(entry.insumoId)) {
        throw new Error('Cada insumo requiere un insumoId entero');
      }
      if (typeof entry.cantidad !== 'number' || entry.cantidad <= 0) {
        throw new Error('Cada insumo requiere una cantidad mayor a 0');
      }
    }
    return true;
  });

const createProductoRules = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 120 }).withMessage('El nombre debe tener entre 2 y 120 caracteres'),

  body('descripcion')
    .optional({ nullable: true })
    .isString().withMessage('La descripción debe ser texto')
    .isLength({ max: 2000 }).withMessage('La descripción no puede superar 2000 caracteres'),

  body('precioVenta')
    .notEmpty().withMessage('El precioVenta es requerido')
    .isFloat({ min: 0 }).withMessage('El precioVenta debe ser un número positivo'),

  body('activo')
    .optional()
    .isBoolean().withMessage('activo debe ser booleano'),

  insumosRule,
];

const updateProductoRules = [
  param('id')
    .isInt({ min: 1 }).withMessage('El id debe ser un entero positivo'),

  body('nombre')
    .optional()
    .trim()
    .notEmpty().withMessage('El nombre no puede estar vacío')
    .isLength({ min: 2, max: 120 }).withMessage('El nombre debe tener entre 2 y 120 caracteres'),

  body('descripcion')
    .optional({ nullable: true })
    .isString().withMessage('La descripción debe ser texto')
    .isLength({ max: 2000 }).withMessage('La descripción no puede superar 2000 caracteres'),

  body('precioVenta')
    .optional()
    .isFloat({ min: 0 }).withMessage('El precioVenta debe ser un número positivo'),

  body('activo')
    .optional()
    .isBoolean().withMessage('activo debe ser booleano'),

  insumosRule,
];

const getByIdRules = [
  param('id')
    .isInt({ min: 1 }).withMessage('El id debe ser un entero positivo'),
];

const deleteRules = [
  param('id')
    .isInt({ min: 1 }).withMessage('El id debe ser un entero positivo'),
];

const listRules = [
  query('search')
    .optional()
    .isString().withMessage('search debe ser texto')
    .isLength({ max: 120 }).withMessage('search no puede superar 120 caracteres'),

  query('activo')
    .optional()
    .isIn(['true', 'false']).withMessage('activo debe ser "true" o "false"'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page debe ser un entero positivo'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit debe estar entre 1 y 100'),
];

module.exports = {
  createProductoRules,
  updateProductoRules,
  getByIdRules,
  deleteRules,
  listRules,
};
