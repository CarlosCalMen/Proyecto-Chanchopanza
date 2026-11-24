'use strict';

const sucursalRepository = require('./sucursal.repository');
const AppError           = require('../../helpers/AppError');

const DEFAULT_LIMIT = 20;

/**
 * Lista sucursales con paginación y filtros.
 */
const listSucursales = async ({ search, activo, page = 1, limit = DEFAULT_LIMIT } = {}) => {
  const parsedPage  = Math.max(parseInt(page,  10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_LIMIT, 1), 100);
  const offset      = (parsedPage - 1) * parsedLimit;

  const activoBool =
    activo === 'true' ? true : activo === 'false' ? false : undefined;

  const { rows, count } = await sucursalRepository.findAll({
    search,
    activo: activoBool,
    limit: parsedLimit,
    offset,
  });

  return {
    items: rows,
    meta: {
      total:      count,
      page:       parsedPage,
      limit:      parsedLimit,
      totalPages: Math.ceil(count / parsedLimit),
    },
  };
};

/**
 * Obtiene una sucursal por id con sus empleados.
 */
const getSucursalById = async (id) => {
  const sucursal = await sucursalRepository.findById(id);
  if (!sucursal) throw new AppError('Sucursal no encontrada', 404);
  return sucursal;
};

/**
 * Crea una nueva sucursal.
 */
const createSucursal = async (data) => {
  const existing = await sucursalRepository.findByNombre(data.nombre);
  if (existing) throw new AppError('Ya existe una sucursal con ese nombre', 409);

  return sucursalRepository.create({
    nombre:    data.nombre,
    direccion: data.direccion ?? null,
    telefono:  data.telefono  ?? null,
    activo:    data.activo    ?? true,
  });
};

/**
 * Actualiza una sucursal existente.
 */
const updateSucursal = async (id, data) => {
  const sucursal = await sucursalRepository.findById(id);
  if (!sucursal) throw new AppError('Sucursal no encontrada', 404);

  if (data.nombre && data.nombre !== sucursal.nombre) {
    const existing = await sucursalRepository.findByNombre(data.nombre, id);
    if (existing) throw new AppError('Ya existe una sucursal con ese nombre', 409);
  }

  return sucursalRepository.update(sucursal, {
    nombre:    data.nombre    ?? sucursal.nombre,
    direccion: data.direccion ?? sucursal.direccion,
    telefono:  data.telefono  ?? sucursal.telefono,
    activo:    typeof data.activo === 'boolean' ? data.activo : sucursal.activo,
  });
};

/**
 * Elimina una sucursal.
 *
 * Reglas de negocio:
 * - Si tiene empleados asignados → no se puede eliminar ni desactivar
 * - Si no tiene empleados pero tiene historial (órdenes/compras) → se desactiva
 * - Si no tiene ninguna referencia → se elimina físicamente
 */
const deleteSucursal = async (id) => {
  const sucursal = await sucursalRepository.findById(id);
  if (!sucursal) throw new AppError('Sucursal no encontrada', 404);

  // Bloqueo duro: no se puede eliminar con empleados activos
  const totalEmpleados = await sucursalRepository.countEmpleados(id);
  if (totalEmpleados > 0) {
    throw new AppError(
      `No se puede eliminar la sucursal: tiene ${totalEmpleados} empleado(s) asignado(s). ` +
      'Reasigna o elimina los empleados primero.',
      409
    );
  }

  // Sin empleados: verificar historial en Orden y Compra
  const { Orden, Compra } = require('../../config/db');
  const tieneOrdenes = await Orden.findOne({ where: { sucursalId: id } });
  const tieneCompras = await Compra.findOne({ where: { sucursalId: id } });

  if (tieneOrdenes || tieneCompras) {
    await sucursalRepository.deactivate(sucursal);
    return { desactivado: true, eliminado: false };
  }

  await sucursalRepository.hardDelete(sucursal);
  return { desactivado: false, eliminado: true };
};

module.exports = {
  listSucursales,
  getSucursalById,
  createSucursal,
  updateSucursal,
  deleteSucursal,
};
