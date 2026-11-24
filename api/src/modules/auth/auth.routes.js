'use strict';

const { Router } = require('express');
const { body }   = require('express-validator');

const authController     = require('./auth.controller');
const validateMiddleware = require('../../middlewares/validate.middleware');
const authMiddleware     = require('../../middlewares/auth.middleware');
const { passwordRule }   = require('../../helpers/passwordRules');

const router = Router();

const loginRules = [
  body('nombreUsuario').trim().notEmpty().withMessage('El nombreUsuario es requerido'),
  body('password').notEmpty().withMessage('La contraseña es requerida'),
];

const refreshRules = [
  body('refreshToken').optional().isString().withMessage('refreshToken debe ser texto'),
];

const changePasswordRules = [
  body('passwordActual').notEmpty().withMessage('La contraseña actual es requerida'),
  passwordRule('passwordNueva', 'La nueva contraseña'),
];

// Rutas públicas
router.post('/login',   loginRules,   validateMiddleware, authController.login);
router.post('/refresh', refreshRules, validateMiddleware, authController.refresh);
router.post('/logout',                                    authController.logout);

// Ruta protegida
router.get('/me', authMiddleware, authController.me);
router.patch(
  '/password',
  authMiddleware,
  changePasswordRules,
  validateMiddleware,
  authController.changePassword
);

module.exports = router;
