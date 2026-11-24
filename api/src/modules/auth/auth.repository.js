'use strict';

const { Usuario, Empleado, Perfil } = require('../../config/db');

/**
 * Busca un usuario por nombreUsuario incluyendo passwordHash (scope auth).
 */
const findByUsername = async (nombreUsuario) => {
  return Usuario.scope('withPassword').findOne({
    where: { nombreUsuario, activo: true },
    include: [
      { model: Perfil,   as: 'perfil' },
      { model: Empleado, as: 'empleado' },
    ],
  });
};

/**
 * Busca un usuario activo por PK (sin passwordHash).
 */
const findById = async (id) => {
  return Usuario.findByPk(id, {
    include: [
      { model: Perfil,   as: 'perfil' },
      { model: Empleado, as: 'empleado' },
    ],
  });
};

module.exports = { findByUsername, findById };
