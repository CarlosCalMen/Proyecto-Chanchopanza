'use strict';

const { body, param, query } = require('express-validator');
const { passwordRule }        = require('../../helpers/passwordRules');

const idRule = param('id').isInt({ min: 1 }).withMessage('El id debe ser un entero positivo');

// Letras, números, punto, guion y guion bajo (sin espacios)
const nombreUsuarioRule = (opcional) => {
  const r = body('nombreUsuario');
  return (opcional ? r.optional() : r.exists({ checkFalsy: true }).withMessage('El nombreUsuario es requerido'))
    .trim()
    .matches(/^[A-Za-z0-9._-]{3,50}$/)
    .withMessage('El nombreUsuario debe tener 3 a 50 caracteres: letras, números, punto, guion o guion bajo');
};

const textoRule = (campo, etiqueta, max, opcional) => {
  const r = body(campo);
  return (opcional ? r.optional() : r.exists({ checkFalsy: true }).withMessage(`${etiqueta} es requerido`))
    .trim()
    .isLength({ min: 2, max }).withMessage(`${etiqueta} debe tener entre 2 y ${max} caracteres`);
};

const telefonoRule = body('telefono')
  .optional({ nullable: true })
  .isString().withMessage('El teléfono debe ser texto')
  .isLength({ max: 20 }).withMessage('El teléfono no puede superar 20 caracteres');

const createUsuarioRules = [
  nombreUsuarioRule(false),
  passwordRule('password'),
  body('perfilId')
    .notEmpty().withMessage('El perfilId es requerido')
    .isInt({ min: 1 }).withMessage('El perfilId debe ser un entero positivo'),
  body('sucursalId')
    .notEmpty().withMessage('El sucursalId es requerido')
    .isInt({ min: 1 }).withMessage('El sucursalId debe ser un entero positivo'),
  textoRule('nombre', 'El nombre', 80, false),
  textoRule('apellidos', 'Los apellidos', 80, false),
  telefonoRule,
  body('activo').optional().isBoolean().withMessage('activo debe ser booleano'),
];

const updateUsuarioRules = [
  idRule,
  nombreUsuarioRule(true),
  body('perfilId').optional().isInt({ min: 1 }).withMessage('El perfilId debe ser un entero positivo'),
  body('sucursalId').optional().isInt({ min: 1 }).withMessage('El sucursalId debe ser un entero positivo'),
  textoRule('nombre', 'El nombre', 80, true),
  textoRule('apellidos', 'Los apellidos', 80, true),
  telefonoRule,
  body('activo').optional().isBoolean().withMessage('activo debe ser booleano'),
];

const resetPasswordRules = [idRule, passwordRule('password', 'La nueva contraseña')];
const getByIdRules = [idRule];
const deleteRules  = [idRule];

const listRules = [
  query('search').optional().isString().isLength({ max: 100 }).withMessage('search no puede superar 100 caracteres'),
  query('perfilId').optional().isInt({ min: 1 }).withMessage('perfilId debe ser un entero positivo'),
  query('sucursalId').optional().isInt({ min: 1 }).withMessage('sucursalId debe ser un entero positivo'),
  query('activo').optional().isIn(['true', 'false']).withMessage('activo debe ser "true" o "false"'),
  query('page').optional().isInt({ min: 1 }).withMessage('page debe ser un entero positivo'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit debe estar entre 1 y 100'),
];

module.exports = {
  createUsuarioRules,
  updateUsuarioRules,
  resetPasswordRules,
  getByIdRules,
  deleteRules,
  listRules,
};
