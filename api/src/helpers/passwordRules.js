'use strict';

const { body } = require('express-validator');

/**
 * Regla de contraseña segura para express-validator.
 *  - 8 a 72 caracteres (72 es el límite real de bcrypt)
 *  - al menos una letra y un número
 */
const passwordRule = (campo, etiqueta = 'La contraseña') =>
  body(campo)
    .isString().withMessage(`${etiqueta} es requerida`)
    .bail()
    .isLength({ min: 8, max: 72 }).withMessage(`${etiqueta} debe tener entre 8 y 72 caracteres`)
    .matches(/[A-Za-z]/).withMessage(`${etiqueta} debe incluir al menos una letra`)
    .matches(/\d/).withMessage(`${etiqueta} debe incluir al menos un número`);

module.exports = { passwordRule };
