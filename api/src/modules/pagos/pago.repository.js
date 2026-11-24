'use strict';

const { fn, col } = require('sequelize');
const { Pago, Orden, Cliente, Sucursal, Empleado, sequelize } = require('../../config/db');
const { whereFechas } = require('../../helpers/dateRange');

const buildWhere = ({ empleadoId, metodoPago, estado, fechaDesde, fechaHasta }) => {
  const where = {};
  if (empleadoId) where.empleadoId = empleadoId;
  if (metodoPago) where.metodoPago = metodoPago;
  if (estado)     where.estado     = estado;
  Object.assign(where, whereFechas('fecha_de_pago', fechaDesde, fechaHasta));
  return where;
};

/**
 * Lista cobros con la orden, cliente, sucursal y empleado que cobró.
 */
const findAll = async ({ sucursalId, limit, offset, ...filtros } = {}) => {
  return Pago.findAndCountAll({
    where: buildWhere(filtros),
    include: [
      {
        model: Orden,
        as: 'orden',
        attributes: ['id', 'total', 'estado', 'sucursalId'],
        where: sucursalId ? { sucursalId } : undefined,
        required: Boolean(sucursalId),
        include: [
          { model: Cliente,  as: 'cliente',  attributes: ['id', 'nombre'] },
          { model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] },
        ],
      },
      { model: Empleado, as: 'empleado', attributes: ['id', 'nombre', 'apellidos'] },
    ],
    limit,
    offset,
    order: [['fechaDePago', 'DESC']],
    distinct: true,
  });
};

/**
 * Totales de cobros vigentes agrupados por método de pago.
 * `total` es lo que realmente quedó cobrado (en efectivo = dinero en caja,
 * ya descontado el vuelto).
 */
const resumenPorMetodo = async ({ sucursalId, ...filtros } = {}) => {
  const where = { ...buildWhere(filtros), estado: 'registrado' };

  return Pago.findAll({
    where,
    attributes: [
      'metodoPago',
      [fn('COUNT', col('Pago.id')),  'cantidad'],
      [fn('SUM',   col('Pago.monto')), 'total'],
    ],
    include: sucursalId
      ? [{ model: Orden, as: 'orden', attributes: [], where: { sucursalId }, required: true }]
      : [],
    group: ['Pago.metodo_pago'],
    order: [['metodoPago', 'ASC']],
    raw: true,
  });
};

module.exports = { sequelize, findAll, resumenPorMetodo };
