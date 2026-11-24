'use strict';

const usuarioService = require('./usuario.service');
const apiResponse    = require('../../helpers/apiResponse');

/**
 * GET /api/usuarios
 * Query: ?search=&perfilId=&sucursalId=&activo=&page=&limit=
 * Roles: admin
 */
const list = async (req, res, next) => {
  try {
    const result = await usuarioService.listUsuarios(req.query);
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Usuarios obtenidos correctamente',
      data: result.items,
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/usuarios/:id
 */
const getById = async (req, res, next) => {
  try {
    const usuario = await usuarioService.getUsuarioById(req.params.id);
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Usuario obtenido correctamente',
      data: usuario,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/usuarios
 * Crea usuario + empleado.
 * Body: { nombreUsuario, password, perfilId, sucursalId, nombre, apellidos, telefono?, activo? }
 */
const create = async (req, res, next) => {
  try {
    const usuario = await usuarioService.createUsuario(req.body);
    return apiResponse.success(res, {
      statusCode: 201,
      message: 'Usuario creado correctamente',
      data: usuario,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/usuarios/:id
 * Body (todo opcional): { nombreUsuario, perfilId, activo, nombre, apellidos, telefono, sucursalId }
 */
const update = async (req, res, next) => {
  try {
    const usuario = await usuarioService.updateUsuario(req.params.id, req.body, req.usuario);
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Usuario actualizado correctamente',
      data: usuario,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/usuarios/:id/password
 * Body: { password }
 * El admin restablece la contraseña de otro usuario.
 */
const resetPassword = async (req, res, next) => {
  try {
    await usuarioService.resetPassword(req.params.id, req.body.password);
    return apiResponse.success(res, {
      statusCode: 200,
      message: 'Contraseña restablecida correctamente',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/usuarios/:id
 */
const remove = async (req, res, next) => {
  try {
    const result = await usuarioService.deleteUsuario(req.params.id, req.usuario);
    return apiResponse.success(res, {
      statusCode: 200,
      message: result.eliminado
        ? 'Usuario eliminado correctamente'
        : 'El usuario tiene historial de operaciones y fue desactivado en lugar de eliminado',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getById, create, update, resetPassword, remove };
