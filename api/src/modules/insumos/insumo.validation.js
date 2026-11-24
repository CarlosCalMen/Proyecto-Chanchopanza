'use strict';

const { body, param, query } = require('express-validator');

const createInsumoRules = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 120 }).withMessage('El nombre debe tener entre 2 y 120 caracteres'),

  body('unidad')
    .trim()
    .notEmpty().withMessage('La unidad de medida es requerida')
    .isLength({ min: 1, max: 20 }).withMessage('La unidad no puede superar 20 caracteres'),

  body('stock')
    .optional()
    .isFloat({ min: 0 }).withMessage('El stock debe ser un número mayor o igual a 0'),
];

const updateInsumoRules = [
  param('id')
    .isInt({ min: 1 }).withMessage('El id debe ser un entero positivo'),

  body('nombre')
    .optional()
    .trim()
    .notEmpty().withMessage('El nombre no puede estar vacío')
    .isLength({ min: 2, max: 120 }).withMessage('El nombre debe tener entre 2 y 120 caracteres'),

  body('unidad')
    .optional()
    .trim()
    .notEmpty().withMessage('La unidad no puede estar vacía')
    .isLength({ min: 1, max: 20 }).withMessage('La unidad no puede superar 20 caracteres'),

  body('stock')
    .optional()
    .isFloat({ min: 0 }).withMessage('El stock debe ser un número mayor o igual a 0'),
];

const ajustarStockRules = [
  param('id')
    .isInt({ min: 1 }).withMessage('El id debe ser un entero positivo'),

  body('cantidad')
    .notEmpty().withMessage('La cantidad es requerida')
    .isFloat().withMessage('La cantidad debe ser un número')
    .custom((val) => val !== 0).withMessage('La cantidad no puede ser 0'),

  body('tipo')
    .notEmpty().withMessage('El tipo es requerido')
    .isIn(['entrada', 'salida']).withMessage('El tipo debe ser "entrada" o "salida"'),
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

  query('stockBajo')
    .optional()
    .isFloat({ min: 0 }).withMessage('stockBajo debe ser un número mayor o igual a 0'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page debe ser un entero positivo'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit debe estar entre 1 y 100'),
];

module.exports = {
  createInsumoRules,
  updateInsumoRules,
  ajustarStockRules,
  getByIdRules,
  deleteRules,
  listRules,
};
