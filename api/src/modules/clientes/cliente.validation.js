'use strict';

const { body, param, query } = require('express-validator');

const createClienteRules = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 150 }).withMessage('El nombre debe tener entre 2 y 150 caracteres'),

  body('telefono')
    .optional({ nullable: true })
    .isString().withMessage('El teléfono debe ser texto')
    .isLength({ max: 20 }).withMessage('El teléfono no puede superar 20 caracteres'),

  body('email')
    .optional({ nullable: true })
    .isEmail().withMessage('El email no tiene un formato válido')
    .isLength({ max: 120 }).withMessage('El email no puede superar 120 caracteres')
    .normalizeEmail(),
];

const updateClienteRules = [
  param('id')
    .isInt({ min: 1 }).withMessage('El id debe ser un entero positivo'),

  body('nombre')
    .optional()
    .trim()
    .notEmpty().withMessage('El nombre no puede estar vacío')
    .isLength({ min: 2, max: 150 }).withMessage('El nombre debe tener entre 2 y 150 caracteres'),

  body('telefono')
    .optional({ nullable: true })
    .isString().withMessage('El teléfono debe ser texto')
    .isLength({ max: 20 }).withMessage('El teléfono no puede superar 20 caracteres'),

  body('email')
    .optional({ nullable: true })
    .isEmail().withMessage('El email no tiene un formato válido')
    .isLength({ max: 120 }).withMessage('El email no puede superar 120 caracteres')
    .normalizeEmail(),
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
    .isLength({ max: 150 }).withMessage('search no puede superar 150 caracteres'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page debe ser un entero positivo'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit debe estar entre 1 y 100'),
];

module.exports = {
  createClienteRules,
  updateClienteRules,
  getByIdRules,
  deleteRules,
  listRules,
};
