'use strict';

const perfilService = require('./perfil.service');
const apiResponse   = require('../../helpers/apiResponse');

/**
 * GET /api/perfiles
 * Lista los perfiles (admin, socio, caja) para poblar selectores.
 * Roles: admin
 */
const list = async (req, res, next) => {
  try {
    const data = await perfilService.listPerfiles();
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Perfiles obtenidos correctamente',
      data,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { list };
