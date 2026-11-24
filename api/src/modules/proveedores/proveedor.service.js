'use strict';

const proveedorRepository = require('./proveedor.repository');
const AppError            = require('../../helpers/AppError');

const DEFAULT_LIMIT = 20;

/**
 * Lista proveedores con paginación y búsqueda.
 */
const listProveedores = async ({ search, page = 1, limit = DEFAULT_LIMIT } = {}) => {
  const parsedPage  = Math.max(parseInt(page,  10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_LIMIT, 1), 100);
  const offset      = (parsedPage - 1) * parsedLimit;

  const { rows, count } = await proveedorRepository.findAll({
    search,
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
 * Obtiene un proveedor por id con sus últimas 10 compras.
 */
const getProveedorById = async (id) => {
  const proveedor = await proveedorRepository.findById(id);
  if (!proveedor) throw new AppError('Proveedor no encontrado', 404);
  return proveedor;
};

/**
 * Crea un nuevo proveedor.
 * Valida unicidad de nombre y email por separado para dar mensajes claros.
 */
const createProveedor = async (data) => {
  const existeNombre = await proveedorRepository.findByNombre(data.nombre);
  if (existeNombre) throw new AppError('Ya existe un proveedor con ese nombre', 409);

  if (data.email) {
    const existeEmail = await proveedorRepository.findByEmail(data.email);
    if (existeEmail) throw new AppError('Ya existe un proveedor con ese email', 409);
  }

  return proveedorRepository.create({
    nombre:           data.nombre,
    nombreDeContacto: data.nombreDeContacto ?? null,
    telefono:         data.telefono         ?? null,
    email:            data.email            ?? null,
  });
};

/**
 * Actualiza un proveedor existente.
 */
const updateProveedor = async (id, data) => {
  const proveedor = await proveedorRepository.findById(id);
  if (!proveedor) throw new AppError('Proveedor no encontrado', 404);

  if (data.nombre && data.nombre !== proveedor.nombre) {
    const existing = await proveedorRepository.findByNombre(data.nombre, id);
    if (existing) throw new AppError('Ya existe un proveedor con ese nombre', 409);
  }

  if (data.email && data.email !== proveedor.email) {
    const existing = await proveedorRepository.findByEmail(data.email, id);
    if (existing) throw new AppError('Ya existe un proveedor con ese email', 409);
  }

  return proveedorRepository.update(proveedor, {
    nombre:           data.nombre           ?? proveedor.nombre,
    nombreDeContacto: data.nombreDeContacto ?? proveedor.nombreDeContacto,
    telefono:         data.telefono         ?? proveedor.telefono,
    email:            data.email            ?? proveedor.email,
  });
};

/**
 * Elimina un proveedor.
 *
 * Regla de negocio:
 * - Si tiene historial de compras → no se elimina (preserva integridad
 *   de reportes de egresos). Se informa con 409.
 * - Sin historial → eliminación física.
 *
 * Los proveedores no tienen campo activo igual que los clientes —
 * un proveedor con historial simplemente no se borra.
 */
const deleteProveedor = async (id) => {
  const proveedor = await proveedorRepository.findById(id);
  if (!proveedor) throw new AppError('Proveedor no encontrado', 404);

  const tieneHistorial = await proveedorRepository.hasCompras(id);
  if (tieneHistorial) {
    throw new AppError(
      'No se puede eliminar el proveedor: tiene compras registradas. ' +
      'Los datos del proveedor se conservan para mantener el historial de egresos.',
      409
    );
  }

  await proveedorRepository.hardDelete(proveedor);
  return { eliminado: true };
};

module.exports = {
  listProveedores,
  getProveedorById,
  createProveedor,
  updateProveedor,
  deleteProveedor,
};
