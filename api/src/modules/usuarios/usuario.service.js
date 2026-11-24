'use strict';

const usuarioRepository = require('./usuario.repository');
const authService       = require('../auth/auth.service');
const { Perfil, Sucursal } = require('../../config/db');
const AppError          = require('../../helpers/AppError');

const DEFAULT_LIMIT = 20;

// ── Helpers privados ──────────────────────────────────────────────────────────

const exigirPerfil = async (perfilId) => {
  const perfil = await Perfil.findByPk(perfilId);
  if (!perfil) throw new AppError('Perfil no encontrado', 422);
  return perfil;
};

const exigirSucursalActiva = async (sucursalId) => {
  const sucursal = await Sucursal.findByPk(sucursalId);
  if (!sucursal || !sucursal.activo) throw new AppError('Sucursal no encontrada o inactiva', 422);
  return sucursal;
};

const exigirNombreUsuarioLibre = async (nombreUsuario, excludeId = null) => {
  const existente = await usuarioRepository.findByNombreUsuario(nombreUsuario, excludeId);
  if (existente) throw new AppError('Ya existe un usuario con ese nombre de usuario', 409);
};

// ── Métodos públicos ──────────────────────────────────────────────────────────

const listUsuarios = async ({ search, perfilId, sucursalId, activo, page = 1, limit = DEFAULT_LIMIT } = {}) => {
  const parsedPage  = Math.max(parseInt(page,  10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_LIMIT, 1), 100);
  const offset      = (parsedPage - 1) * parsedLimit;

  const activoBool = activo === 'true' ? true : activo === 'false' ? false : undefined;

  const { rows, count } = await usuarioRepository.findAll({
    search,
    perfilId:   perfilId   ? parseInt(perfilId, 10)   : undefined,
    sucursalId: sucursalId ? parseInt(sucursalId, 10) : undefined,
    activo: activoBool,
    limit: parsedLimit,
    offset,
  });

  return {
    items: rows,
    meta: {
      total:      count,
      page:       parsedPage,
      limit:      parsedLimit,
      totalPages: Math.ceil(count / parsedLimit),
    },
  };
};

const getUsuarioById = async (id) => {
  const usuario = await usuarioRepository.findById(id);
  if (!usuario) throw new AppError('Usuario no encontrado', 404);
  return usuario;
};

/**
 * Crea el usuario y su empleado en una sola transacción.
 * Todo usuario tiene un empleado: es el que lleva la sucursal y firma las operaciones.
 */
const createUsuario = async (data) => {
  await exigirPerfil(data.perfilId);
  await exigirSucursalActiva(data.sucursalId);
  await exigirNombreUsuarioLibre(data.nombreUsuario);

  const passwordHash = await authService.hashPassword(data.password);

  const transaction = await usuarioRepository.sequelize.transaction();
  try {
    const usuario = await usuarioRepository.createUsuario(
      {
        perfilId:      data.perfilId,
        nombreUsuario: data.nombreUsuario,
        passwordHash,
        activo:        data.activo ?? true,
      },
      transaction
    );

    await usuarioRepository.createEmpleado(
      {
        usuarioId:  usuario.id,
        sucursalId: data.sucursalId,
        nombre:     data.nombre,
        apellidos:  data.apellidos,
        telefono:   data.telefono ?? null,
      },
      transaction
    );

    await transaction.commit();
    return usuarioRepository.findById(usuario.id);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

/**
 * Actualiza datos de acceso (perfil, activo, nombreUsuario) y del empleado
 * (nombre, apellidos, teléfono, sucursal).
 *
 * Protecciones:
 *  - Nadie puede cambiar su PROPIO perfil ni desactivarse a sí mismo
 *    (evita quedarse sin administradores).
 *  - Si cambia algo que afecta la sesión, se cierran sus sesiones activas.
 */
const updateUsuario = async (id, data, actor) => {
  const usuario = await usuarioRepository.findById(id);
  if (!usuario) throw new AppError('Usuario no encontrado', 404);

  const esMismoUsuario = usuario.id === actor.id;
  const cambiaPerfil   = data.perfilId !== undefined && data.perfilId !== usuario.perfilId;
  const desactiva      = data.activo === false && usuario.activo;

  if (esMismoUsuario && (cambiaPerfil || data.activo === false)) {
    throw new AppError('No puedes cambiar tu propio perfil ni desactivar tu propia cuenta', 409);
  }

  if (cambiaPerfil) await exigirPerfil(data.perfilId);

  const cambiaNombreUsuario =
    data.nombreUsuario !== undefined && data.nombreUsuario !== usuario.nombreUsuario;
  if (cambiaNombreUsuario) await exigirNombreUsuarioLibre(data.nombreUsuario, id);

  const empleado = usuario.empleado;
  const cambiaSucursal =
    data.sucursalId !== undefined && (!empleado || data.sucursalId !== empleado.sucursalId);
  if (cambiaSucursal) await exigirSucursalActiva(data.sucursalId);

  if (!empleado && (data.nombre || data.apellidos || data.sucursalId)) {
    if (!(data.nombre && data.apellidos && data.sucursalId)) {
      throw new AppError(
        'El usuario no tiene empleado asociado: para crearlo envía nombre, apellidos y sucursalId',
        422
      );
    }
  }

  const transaction = await usuarioRepository.sequelize.transaction();
  try {
    await usuario.update(
      {
        perfilId:      data.perfilId      ?? usuario.perfilId,
        nombreUsuario: data.nombreUsuario ?? usuario.nombreUsuario,
        activo:        typeof data.activo === 'boolean' ? data.activo : usuario.activo,
      },
      { transaction }
    );

    if (empleado) {
      await empleado.update(
        {
          nombre:     data.nombre     ?? empleado.nombre,
          apellidos:  data.apellidos  ?? empleado.apellidos,
          telefono:   data.telefono   !== undefined ? data.telefono : empleado.telefono,
          sucursalId: data.sucursalId ?? empleado.sucursalId,
        },
        { transaction }
      );
    } else if (data.nombre && data.apellidos && data.sucursalId) {
      await usuarioRepository.createEmpleado(
        {
          usuarioId:  usuario.id,
          sucursalId: data.sucursalId,
          nombre:     data.nombre,
          apellidos:  data.apellidos,
          telefono:   data.telefono ?? null,
        },
        transaction
      );
    }

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }

  // Cambios que invalidan la sesión actual: se obliga a renovar credenciales
  if (cambiaPerfil || desactiva || cambiaSucursal || cambiaNombreUsuario) {
    authService.revokeUserTokens(usuario.id);
  }

  return usuarioRepository.findById(id);
};

/**
 * Restablece la contraseña de otro usuario (la define el admin) y cierra sus sesiones.
 */
const resetPassword = async (id, password) => {
  const usuario = await usuarioRepository.findById(id);
  if (!usuario) throw new AppError('Usuario no encontrado', 404);

  await usuarioRepository.updatePassword(usuario, await authService.hashPassword(password));
  authService.revokeUserTokens(usuario.id);
};

/**
 * Elimina un usuario.
 *  - No puedes eliminarte a ti mismo.
 *  - Con historial (órdenes, compras o cobros) se DESACTIVA, para no romper reportes.
 *  - Sin historial se elimina físicamente (empleado y usuario).
 */
const deleteUsuario = async (id, actor) => {
  const usuario = await usuarioRepository.findById(id);
  if (!usuario) throw new AppError('Usuario no encontrado', 404);

  if (usuario.id === actor.id) {
    throw new AppError('No puedes eliminar tu propia cuenta', 409);
  }

  if (await usuarioRepository.tieneHistorial(usuario.empleado?.id)) {
    await usuario.update({ activo: false });
    authService.revokeUserTokens(usuario.id);
    return { desactivado: true, eliminado: false };
  }

  const transaction = await usuarioRepository.sequelize.transaction();
  try {
    await usuarioRepository.destroyEmpleadoDeUsuario(usuario.id, transaction);
    await usuario.destroy({ transaction });
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }

  authService.revokeUserTokens(usuario.id);
  return { desactivado: false, eliminado: true };
};

module.exports = {
  listUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  resetPassword,
  deleteUsuario,
};
