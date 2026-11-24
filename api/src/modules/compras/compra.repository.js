'use strict';

const { Op } = require('sequelize');
const { whereFechas } = require('../../helpers/dateRange');
const {
  Compra, DetalleCompra, Insumo,
  Proveedor, Empleado, Sucursal, sequelize,
} = require('../../config/db');

// ── Includes reutilizables ────────────────────────────────────────────────────

const includeCompleto = [
  { model: Proveedor, as: 'proveedor', attributes: ['id', 'nombre', 'nombreDeContacto', 'telefono'] },
  { model: Sucursal,  as: 'sucursal',  attributes: ['id', 'nombre'] },
  { model: Empleado,  as: 'empleado',  attributes: ['id', 'nombre', 'apellidos'] },
  {
    model: DetalleCompra,
    as: 'detalles',
    include: [{ model: Insumo, as: 'insumo', attributes: ['id', 'nombre', 'unidad', 'stock'] }],
  },
];

const includeResumen = [
  { model: Proveedor, as: 'proveedor', attributes: ['id', 'nombre'] },
  { model: Sucursal,  as: 'sucursal',  attributes: ['id', 'nombre'] },
  { model: Empleado,  as: 'empleado',  attributes: ['id', 'nombre', 'apellidos'] },
];

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * Lista compras con filtros y paginación.
 */
const findAll = async ({
  sucursalId, proveedorId, empleadoId,
  estado, fechaDesde, fechaHasta,
  limit, offset,
} = {}) => {
  const where = {};

  if (sucursalId)  where.sucursalId  = sucursalId;
  if (proveedorId) where.proveedorId = proveedorId;
  if (empleadoId)  where.empleadoId  = empleadoId;
  if (estado)      where.estado      = estado;

  Object.assign(where, whereFechas('fecha_de_compra', fechaDesde, fechaHasta));

  return Compra.findAndCountAll({
    where,
    include: includeResumen,
    limit,
    offset,
    order: [['fechaDeCompra', 'DESC']],
    distinct: true,
  });
};

/**
 * Busca una compra por PK con todos sus detalles y relaciones.
 */
const findById = async (id) => {
  return Compra.findByPk(id, { include: includeCompleto });
};

/**
 * Crea la cabecera de la compra.
 */
const create = async (data, transaction) => {
  return Compra.create(data, { transaction });
};

/**
 * Inserta los detalles de la compra en bloque.
 */
const createDetalles = async (detalles, transaction) => {
  return DetalleCompra.bulkCreate(detalles, { transaction });
};

/**
 * Actualiza el total en la cabecera.
 */
const updateTotal = async (compraInstance, total, transaction) => {
  return compraInstance.update({ total }, { transaction });
};

/**
 * Cambia el estado de una compra.
 */
const updateEstado = async (compraInstance, estado, transaction) => {
  return compraInstance.update({ estado }, { transaction });
};

/**
 * Elimina los detalles de una compra (para reemplazo en edición).
 */
const deleteDetalles = async (compraId, transaction) => {
  return DetalleCompra.destroy({ where: { compraId }, transaction });
};

module.exports = {
  sequelize,
  findAll,
  findById,
  create,
  createDetalles,
  updateTotal,
  updateEstado,
  deleteDetalles,
};
