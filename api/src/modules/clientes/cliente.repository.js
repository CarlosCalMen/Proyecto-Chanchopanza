'use strict';

const { Op }                  = require('sequelize');
const { Cliente, Orden, sequelize } = require('../../config/db');

/**
 * Lista clientes con filtros opcionales y paginación.
 */
const findAll = async ({ search, limit, offset } = {}) => {
  const where = {};
  if (search) {
    where[Op.or] = [
      { nombre:   { [Op.iLike]: `%${search}%` } },
      { email:    { [Op.iLike]: `%${search}%` } },
      { telefono: { [Op.iLike]: `%${search}%` } },
    ];
  }

  return Cliente.findAndCountAll({
    where,
    limit,
    offset,
    order: [['nombre', 'ASC']],
  });
};

/**
 * Busca un cliente por PK incluyendo resumen de sus órdenes.
 */
const findById = async (id) => {
  return Cliente.findByPk(id, {
    include: [
      {
        model: Orden,
        as: 'ordenes',
        attributes: ['id', 'fechaDeOrden', 'estado', 'total'],
        order: [['fechaDeOrden', 'DESC']],
        limit: 10, // últimas 10 órdenes en el detalle
      },
    ],
  });
};

/**
 * Busca un cliente por email exacto (control de unicidad).
 */
const findByEmail = async (email, excludeId = null) => {
  const where = { email };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  return Cliente.findOne({ where });
};

/**
 * Verifica si el cliente tiene historial de órdenes.
 */
const hasOrdenes = async (clienteId) => {
  const count = await Orden.count({ where: { clienteId } });
  return count > 0;
};

/**
 * Cliente mostrador: el cliente por defecto de las ventas sin datos del cliente.
 */
const findMostrador = async () => {
  return Cliente.findOne({ where: { esMostrador: true } });
};

const create = async (data, options = {}) => {
  return Cliente.create(data, options);
};

const update = async (clienteInstance, data) => {
  return clienteInstance.update(data);
};

const hardDelete = async (clienteInstance) => {
  return clienteInstance.destroy();
};

module.exports = {
  sequelize,
  findAll,
  findById,
  findByEmail,
  findMostrador,
  hasOrdenes,
  create,
  update,
  hardDelete,
};
