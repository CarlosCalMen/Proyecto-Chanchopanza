'use strict';

const { Router } = require('express');

const usuarioController  = require('./usuario.controller');
const validation          = require('./usuario.validation');
const validateMiddleware  = require('../../middlewares/validate.middleware');
const authMiddleware      = require('../../middlewares/auth.middleware');
const roleMiddleware      = require('../../middlewares/role.middleware');

const router = Router();

// Gestión de usuarios y privilegios: EXCLUSIVO del administrador.
// (El socio no puede crear, editar ni eliminar usuarios ni privilegios.)
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

router.get('/',    validation.listRules,         validateMiddleware, usuarioController.list);
router.get('/:id', validation.getByIdRules,      validateMiddleware, usuarioController.getById);
router.post('/',   validation.createUsuarioRules, validateMiddleware, usuarioController.create);
router.put('/:id', validation.updateUsuarioRules, validateMiddleware, usuarioController.update);

/**
 * PATCH /api/usuarios/:id/password
 * El admin restablece la contraseña de otro usuario y cierra sus sesiones.
 * (Cada usuario cambia la suya con PATCH /api/auth/password.)
 */
router.patch('/:id/password', validation.resetPasswordRules, validateMiddleware, usuarioController.resetPassword);

router.delete('/:id', validation.deleteRules, validateMiddleware, usuarioController.remove);

module.exports = router;
