'use strict';

const { Op }                                      = require('sequelize');
const { Insumo, InsumoProducto, Producto, DetalleCompra, sequelize } = require('../../config/db');

/**
 * Lista insumos con filtros opcionales y paginación.
 */
const findAll = async ({ search, stockBajo, limit, offset } = {}) => {
  const where = {};
  if (search) where.nombre = { [Op.iLike]: `%${search}%` };

  // stockBajo: filtra insumos con stock <= umbral indicado
  if (typeof stockBajo === 'number') {
    where.stock = { [Op.lte]: stockBajo };
  }

  return Insumo.findAndCountAll({
    where,
    limit,
    offset,
    order: [['nombre', 'ASC']],
  });
};

/**
 * Busca un insumo por PK incluyendo los productos que lo usan (receta).
 */
const findById = async (id) => {
  return Insumo.findByPk(id, {
    include: [
      {
        model: Producto,
        as: 'productos',
        through: { attributes: ['cantidad'] },
        attributes: ['id', 'nombre', 'precioVenta', 'activo'],
      },
    ],
  });
};

/**
 * Busca un insumo por nombre exacto (control de unicidad).
 */
const findByNombre = async (nombre, excludeId = null) => {
  const where = { nombre };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  return Insumo.findOne({ where });
};

/**
 * Verifica si el insumo está referenciado en algún detalle de compra.
 */
const hasDetalleCompras = async (insumoId) => {
  const count = await DetalleCompra.count({ where: { insumoId } });
  return count > 0;
};

/**
 * Verifica si el insumo está en la receta de algún producto.
 */
const hasProductos = async (insumoId) => {
  const count = await InsumoProducto.count({ where: { insumoId } });
  return count > 0;
};

const create = async (data, options = {}) => {
  return Insumo.create(data, options);
};

const update = async (insumoInstance, data) => {
  return insumoInstance.update(data);
};

/**
 * Ajusta el stock sumando o restando una cantidad.
 * cantidad positiva → incremento (compra recibida)
 * cantidad negativa → decremento (consumo de producción)
 */
const adjustStock = async (insumoInstance, cantidad, transaction) => {
  const nuevoStock = parseFloat(insumoInstance.stock) + cantidad;
  if (nuevoStock < 0) {
    const AppError = require('../../helpers/AppError');
    throw new AppError(
      `Stock insuficiente para el insumo "${insumoInstance.nombre}". ` +
      `Stock actual: ${insumoInstance.stock}, ajuste solicitado: ${cantidad}`,
      409
    );
  }
  return insumoInstance.update({ stock: nuevoStock }, { transaction });
};

const hardDelete = async (insumoInstance) => {
  return insumoInstance.destroy();
};

module.exports = {
  sequelize,
  findAll,
  findById,
  findByNombre,
  hasDetalleCompras,
  hasProductos,
  adjustStock,
  create,
  update,
  hardDelete,
};
