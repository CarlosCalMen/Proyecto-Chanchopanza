'use strict';

const { Router } = require('express');

const perfilController = require('./perfil.controller');
const authMiddleware   = require('../../middlewares/auth.middleware');
const roleMiddleware   = require('../../middlewares/role.middleware');

const router = Router();

router.use(authMiddleware);

// Solo lectura: los perfiles son fijos (admin, socio, caja).
router.get('/', roleMiddleware('admin'), perfilController.list);

module.exports = router;
