'use strict';

const { Op }                        = require('sequelize');
const { Proveedor, Compra, sequelize } = require('../../config/db');

/**
 * Lista proveedores con filtros opcionales y paginación.
 * Búsqueda por nombre, email o nombreDeContacto.
 */
const findAll = async ({ search, limit, offset } = {}) => {
  const where = {};
  if (search) {
    where[Op.or] = [
      { nombre:           { [Op.iLike]: `%${search}%` } },
      { nombreDeContacto: { [Op.iLike]: `%${search}%` } },
      { email:            { [Op.iLike]: `%${search}%` } },
    ];
  }

  return Proveedor.findAndCountAll({
    where,
    limit,
    offset,
    order: [['nombre', 'ASC']],
  });
};

/**
 * Busca un proveedor por PK incluyendo resumen de sus últimas compras.
 */
const findById = async (id) => {
  return Proveedor.findByPk(id, {
    include: [
      {
        model: Compra,
        as: 'compras',
        attributes: ['id', 'fechaDeCompra', 'estado', 'total'],
        order: [['fechaDeCompra', 'DESC']],
        limit: 10,
      },
    ],
  });
};

/**
 * Busca un proveedor por nombre exacto (control de unicidad).
 */
const findByNombre = async (nombre, excludeId = null) => {
  const where = { nombre };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  return Proveedor.findOne({ where });
};

/**
 * Busca un proveedor por email exacto (control de unicidad).
 */
const findByEmail = async (email, excludeId = null) => {
  const where = { email };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  return Proveedor.findOne({ where });
};

/**
 * Verifica si el proveedor tiene historial de compras.
 */
const hasCompras = async (proveedorId) => {
  const count = await Compra.count({ where: { proveedorId } });
  return count > 0;
};

const create = async (data, options = {}) => {
  return Proveedor.create(data, options);
};

const update = async (proveedorInstance, data) => {
  return proveedorInstance.update(data);
};

const hardDelete = async (proveedorInstance) => {
  return proveedorInstance.destroy();
};

module.exports = {
  sequelize,
  findAll,
  findById,
  findByNombre,
  findByEmail,
  hasCompras,
  create,
  update,
  hardDelete,
};
