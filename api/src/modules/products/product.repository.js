'use strict';

const { Op } = require('sequelize');
const { Producto, Insumo, InsumoProducto, DetalleOrden, sequelize } = require('../../config/db');

const findAll = async ({ search, activo, limit, offset } = {}) => {
  const where = {};
  if (search) where.nombre = { [Op.iLike]: `%${search}%` };
  if (typeof activo === 'boolean') where.activo = activo;

  return Producto.findAndCountAll({
    where,
    limit,
    offset,
    order: [['nombre', 'ASC']],
  });
};

const findById = async (id) => {
  return Producto.findByPk(id, {
    include: [
      {
        model: Insumo,
        as: 'insumos',
        through: { attributes: ['cantidad'] },
      },
    ],
  });
};

const findByNombre = async (nombre, excludeId = null) => {
  const where = { nombre };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  return Producto.findOne({ where });
};

const create = async (data, options = {}) => {
  return Producto.create(data, options);
};

const update = async (productoInstance, data) => {
  return productoInstance.update(data);
};

const deactivate = async (productoInstance) => {
  return productoInstance.update({ activo: false });
};

const hardDelete = async (productoInstance) => {
  return productoInstance.destroy();
};

/**
 * Reemplaza la receta completa de insumos de un producto.
 * @param {object} productoInstance
 * @param {Array<{ insumoId: number, cantidad: number }>} insumoEntries
 * @param {import('sequelize').Transaction} [transaction]
 */
const setInsumos = async (productoInstance, insumoEntries, transaction) => {
  await InsumoProducto.destroy({
    where: { productoId: productoInstance.id },
    transaction,
  });

  if (insumoEntries.length > 0) {
    await InsumoProducto.bulkCreate(
      insumoEntries.map((e) => ({
        productoId: productoInstance.id,
        insumoId:   e.insumoId,
        cantidad:   e.cantidad,
      })),
      { transaction }
    );
  }

  return findById(productoInstance.id);
};

module.exports = {
  sequelize,
  findAll,
  findById,
  findByNombre,
  create,
  update,
  deactivate,
  hardDelete,
  setInsumos,
};
