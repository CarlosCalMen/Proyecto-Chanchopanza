'use strict';

const { Op }                        = require('sequelize');
const { Sucursal, Empleado, Usuario, Perfil, sequelize } = require('../../config/db');

/**
 * Lista todas las sucursales con filtros opcionales y paginación.
 */
const findAll = async ({ search, activo, limit, offset } = {}) => {
  const where = {};
  if (search)                       where.nombre = { [Op.iLike]: `%${search}%` };
  if (typeof activo === 'boolean')  where.activo = activo;

  return Sucursal.findAndCountAll({
    where,
    limit,
    offset,
    order: [['nombre', 'ASC']],
  });
};

/**
 * Busca una sucursal por PK incluyendo sus empleados.
 */
const findById = async (id) => {
  return Sucursal.findByPk(id, {
    include: [
      {
        model: Empleado,
        as: 'empleados',
        include: [
          {
            model: Usuario,
            as: 'usuario',
            include: [{ model: Perfil, as: 'perfil' }],
          },
        ],
      },
    ],
  });
};

/**
 * Busca una sucursal por nombre exacto (control de unicidad).
 */
const findByNombre = async (nombre, excludeId = null) => {
  const where = { nombre };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  return Sucursal.findOne({ where });
};

/**
 * Cuenta los empleados activos de una sucursal.
 * Útil para validar antes de desactivar.
 */
const countEmpleados = async (sucursalId) => {
  return Empleado.count({ where: { sucursalId } });
};

const create = async (data, options = {}) => {
  return Sucursal.create(data, options);
};

const update = async (sucursalInstance, data) => {
  return sucursalInstance.update(data);
};

const deactivate = async (sucursalInstance) => {
  return sucursalInstance.update({ activo: false });
};

const hardDelete = async (sucursalInstance) => {
  return sucursalInstance.destroy();
};

module.exports = {
  sequelize,
  findAll,
  findById,
  findByNombre,
  countEmpleados,
  create,
  update,
  deactivate,
  hardDelete,
};
