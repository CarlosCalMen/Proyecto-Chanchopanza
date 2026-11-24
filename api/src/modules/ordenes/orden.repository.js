'use strict';

const { Op }    = require('sequelize');
const {
  Orden, DetalleOrden, Producto,
  Cliente, Empleado, Sucursal, Pago, sequelize,
} = require('../../config/db');
const { whereFechas } = require('../../helpers/dateRange');

// ── Includes reutilizables ────────────────────────────────────────────────────

const includeCompleto = [
  { model: Cliente,  as: 'cliente',  attributes: ['id', 'nombre', 'telefono', 'email'] },
  { model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] },
  { model: Empleado, as: 'empleado', attributes: ['id', 'nombre', 'apellidos'] },
  {
    model: DetalleOrden,
    as: 'detalles',
    include: [{ model: Producto, as: 'producto', attributes: ['id', 'nombre', 'precioVenta'] }],
  },
  {
    model: Pago,
    as: 'pagos',
    attributes: ['id', 'metodoPago', 'monto', 'montoRecibido', 'vuelto', 'estado', 'fechaDePago', 'empleadoId'],
  },
];

const includeResumen = [
  { model: Cliente,  as: 'cliente',  attributes: ['id', 'nombre'] },
  { model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] },
  { model: Empleado, as: 'empleado', attributes: ['id', 'nombre', 'apellidos'] },
];

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * Lista órdenes con filtros y paginación.
 */
const findAll = async ({
  sucursalId, clienteId, empleadoId,
  estado, fechaDesde, fechaHasta,
  limit, offset,
} = {}) => {
  const where = {};

  if (sucursalId) where.sucursalId = sucursalId;
  if (clienteId)  where.clienteId  = clienteId;
  if (empleadoId) where.empleadoId = empleadoId;
  if (estado)     where.estado     = estado;

  Object.assign(where, whereFechas('fecha_de_orden', fechaDesde, fechaHasta));

  return Orden.findAndCountAll({
    where,
    include: includeResumen,
    limit,
    offset,
    order: [['fechaDeOrden', 'DESC']],
    distinct: true, // evita conteo duplicado por los joins
  });
};

/**
 * Busca una orden por PK con todos sus detalles y relaciones.
 */
const findById = async (id) => {
  return Orden.findByPk(id, { include: includeCompleto });
};

/**
 * Crea la cabecera de la orden (sin detalles aún).
 */
const create = async (data, transaction) => {
  return Orden.create(data, { transaction });
};

/**
 * Inserta los detalles de la orden en bloque.
 */
const createDetalles = async (detalles, transaction) => {
  return DetalleOrden.bulkCreate(detalles, { transaction });
};

/**
 * Actualiza el total calculado en la cabecera.
 */
const updateTotal = async (ordenInstance, total, transaction) => {
  return ordenInstance.update({ total }, { transaction });
};

/**
 * Cambia el estado de una orden.
 */
const updateEstado = async (ordenInstance, estado, transaction) => {
  return ordenInstance.update({ estado }, { transaction });
};

/**
 * Elimina los detalles de una orden (para reemplazo en edición).
 */
const deleteDetalles = async (ordenId, transaction) => {
  return DetalleOrden.destroy({ where: { ordenId }, transaction });
};

/**
 * Lee la orden SIN joins y bloqueando su fila (SELECT ... FOR UPDATE).
 * Evita que dos cobros o cambios de estado simultáneos se pisen.
 */
const findByIdForUpdate = async (id, transaction) => {
  return Orden.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
};

/**
 * Registra TODOS los pagos de una orden de una vez (cobro simple o dividido).
 */
const createPagos = async (pagos, transaction) => {
  return Pago.bulkCreate(pagos, { transaction });
};

/**
 * Anula los cobros vigentes de una orden (cuando la orden se anula).
 */
const anularPagos = async (ordenId, transaction) => {
  return Pago.update(
    { estado: 'anulado' },
    { where: { ordenId, estado: 'registrado' }, transaction }
  );
};

module.exports = {
  sequelize,
  findByIdForUpdate,
  createPagos,
  anularPagos,
  findAll,
  findById,
  create,
  createDetalles,
  updateTotal,
  updateEstado,
  deleteDetalles,
};
