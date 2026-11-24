'use strict';

const { Op, fn, col, where: sqlWhere } = require('sequelize');
const {
  Usuario, Empleado, Perfil, Sucursal,
  Orden, Compra, Pago, sequelize,
} = require('../../config/db');

const includeCompleto = (empleadoWhere, empleadoRequerido = false) => [
  { model: Perfil, as: 'perfil' },
  {
    model: Empleado,
    as: 'empleado',
    where: empleadoWhere,
    required: empleadoRequerido,
    include: [{ model: Sucursal, as: 'sucursal', attributes: ['id', 'nombre'] }],
  },
];

/**
 * Lista usuarios con su perfil, empleado y sucursal.
 * La búsqueda abarca nombreUsuario, nombre y apellidos.
 */
const findAll = async ({ search, perfilId, sucursalId, activo, limit, offset } = {}) => {
  const where = {};
  if (typeof activo === 'boolean') where.activo = activo;
  if (perfilId) where.perfilId = perfilId;

  if (search) {
    where[Op.or] = [
      { nombreUsuario:       { [Op.iLike]: `%${search}%` } },
      { '$empleado.nombre$':    { [Op.iLike]: `%${search}%` } },
      { '$empleado.apellidos$': { [Op.iLike]: `%${search}%` } },
    ];
  }

  return Usuario.findAndCountAll({
    where,
    include: includeCompleto(sucursalId ? { sucursalId } : undefined, Boolean(sucursalId)),
    limit,
    offset,
    order: [['nombreUsuario', 'ASC']],
    distinct: true,
    subQuery: false,
  });
};

const findById = async (id) => Usuario.findByPk(id, { include: includeCompleto() });

/**
 * Busca por nombreUsuario sin distinguir mayúsculas (evita "Juan" y "juan").
 */
const findByNombreUsuario = async (nombreUsuario, excludeId = null) => {
  const where = {
    [Op.and]: [sqlWhere(fn('lower', col('nombre_usuario')), nombreUsuario.toLowerCase())],
  };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  return Usuario.findOne({ where });
};

const createUsuario  = async (data, transaction) => Usuario.create(data, { transaction });
const createEmpleado = async (data, transaction) => Empleado.create(data, { transaction });

const updatePassword = async (usuarioInstance, passwordHash) =>
  usuarioInstance.update({ passwordHash });

/**
 * ¿El empleado tiene historial (órdenes, compras o cobros)?
 * Si lo tiene, no se puede borrar sin romper reportes: solo se desactiva.
 */
const tieneHistorial = async (empleadoId) => {
  if (!empleadoId) return false;
  const [ordenes, compras, pagos] = await Promise.all([
    Orden.count({ where: { empleadoId } }),
    Compra.count({ where: { empleadoId } }),
    Pago.count({ where: { empleadoId } }),
  ]);
  return ordenes + compras + pagos > 0;
};

const destroyEmpleadoDeUsuario = async (usuarioId, transaction) =>
  Empleado.destroy({ where: { usuarioId }, transaction });

module.exports = {
  sequelize,
  findAll,
  findById,
  findByNombreUsuario,
  createUsuario,
  createEmpleado,
  updatePassword,
  tieneHistorial,
  destroyEmpleadoDeUsuario,
};
