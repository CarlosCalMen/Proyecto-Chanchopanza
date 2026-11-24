'use strict';

const { Usuario, Empleado, Perfil, Sucursal } = require('../../config/db');

const includeCompleto = [
  { model: Perfil, as: 'perfil' },
  {
    model: Empleado,
    as: 'empleado',
    include: [{ model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] }],
  },
];

/**
 * Busca un usuario activo por nombreUsuario incluyendo passwordHash (scope withPassword).
 */
const findByUsername = async (nombreUsuario) => {
  return Usuario.scope('withPassword').findOne({
    where: { nombreUsuario, activo: true },
    include: includeCompleto,
  });
};

/**
 * Busca un usuario por PK (sin passwordHash) con perfil, empleado y sucursal.
 */
const findById = async (id) => {
  return Usuario.findByPk(id, { include: includeCompleto });
};

/**
 * Busca un usuario por PK incluyendo passwordHash (para verificar la contraseña actual).
 */
const findByIdWithPassword = async (id) => {
  return Usuario.scope('withPassword').findByPk(id);
};

const updatePassword = async (usuarioInstance, passwordHash) => {
  return usuarioInstance.update({ passwordHash });
};

module.exports = { findByUsername, findById, findByIdWithPassword, updatePassword };
