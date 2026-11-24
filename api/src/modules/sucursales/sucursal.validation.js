'use strict';

const { body, param, query } = require('express-validator');

const createSucursalRules = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),

  body('direccion')
    .optional({ nullable: true })
    .isString().withMessage('La dirección debe ser texto')
    .isLength({ max: 255 }).withMessage('La dirección no puede superar 255 caracteres'),

  body('telefono')
    .optional({ nullable: true })
    .isString().withMessage('El teléfono debe ser texto')
    .isLength({ max: 20 }).withMessage('El teléfono no puede superar 20 caracteres'),

  body('activo')
    .optional()
    .isBoolean().withMessage('activo debe ser booleano'),
];

const updateSucursalRules = [
  param('id')
    .isInt({ min: 1 }).withMessage('El id debe ser un entero positivo'),

  body('nombre')
    .optional()
    .trim()
    .notEmpty().withMessage('El nombre no puede estar vacío')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),

  body('direccion')
    .optional({ nullable: true })
    .isString().withMessage('La dirección debe ser texto')
    .isLength({ max: 255 }).withMessage('La dirección no puede superar 255 caracteres'),

  body('telefono')
    .optional({ nullable: true })
    .isString().withMessage('El teléfono debe ser texto')
    .isLength({ max: 20 }).withMessage('El teléfono no puede superar 20 caracteres'),

  body('activo')
    .optional()
    .isBoolean().withMessage('activo debe ser booleano'),
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
    .isLength({ max: 100 }).withMessage('search no puede superar 100 caracteres'),

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
  createSucursalRules,
  updateSucursalRules,
  getByIdRules,
  deleteRules,
  listRules,
};
