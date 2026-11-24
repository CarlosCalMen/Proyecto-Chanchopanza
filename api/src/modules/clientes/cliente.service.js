'use strict';

const clienteRepository = require('./cliente.repository');
const AppError          = require('../../helpers/AppError');

const DEFAULT_LIMIT = 20;

/**
 * Lista clientes con paginación y búsqueda por nombre, email o teléfono.
 */
const listClientes = async ({ search, page = 1, limit = DEFAULT_LIMIT } = {}) => {
  const parsedPage  = Math.max(parseInt(page,  10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_LIMIT, 1), 100);
  const offset      = (parsedPage - 1) * parsedLimit;

  const { rows, count } = await clienteRepository.findAll({
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
 * Obtiene un cliente por id con sus últimas 10 órdenes.
 */
const getClienteById = async (id) => {
  const cliente = await clienteRepository.findById(id);
  if (!cliente) throw new AppError('Cliente no encontrado', 404);
  return cliente;
};

/**
 * Cliente mostrador ('Cliente Rápido'): el cliente por defecto de las ventas
 * sin datos del cliente. El frontend lo carga al iniciar el punto de venta.
 */
const getClienteMostrador = async () => {
  const cliente = await clienteRepository.findMostrador();
  if (!cliente) {
    throw new AppError('No hay un cliente mostrador configurado', 404);
  }
  return cliente;
};

/**
 * Crea un nuevo cliente.
 * El email es opcional, pero si se provee debe ser único.
 */
const createCliente = async (data) => {
  if (data.email) {
    const existing = await clienteRepository.findByEmail(data.email);
    if (existing) throw new AppError('Ya existe un cliente con ese email', 409);
  }

  return clienteRepository.create({
    nombre:   data.nombre,
    telefono: data.telefono ?? null,
    email:    data.email    ?? null,
  });
};

/**
 * Actualiza un cliente existente.
 */
const updateCliente = async (id, data) => {
  const cliente = await clienteRepository.findById(id);
  if (!cliente) throw new AppError('Cliente no encontrado', 404);

  // Validar unicidad de email si cambió
  if (data.email && data.email !== cliente.email) {
    const existing = await clienteRepository.findByEmail(data.email, id);
    if (existing) throw new AppError('Ya existe un cliente con ese email', 409);
  }

  return clienteRepository.update(cliente, {
    nombre:   data.nombre   ?? cliente.nombre,
    telefono: data.telefono ?? cliente.telefono,
    email:    data.email    ?? cliente.email,
  });
};

/**
 * Elimina un cliente.
 *
 * Regla de negocio:
 * - Si tiene historial de órdenes → no se puede eliminar (preserva integridad
 *   de reportes de ventas). Se informa al usuario con 409.
 * - Sin historial → eliminación física.
 *
 * Nota: los clientes NO se desactivan (no tienen campo activo) —
 * un cliente con historial simplemente no se borra.
 */
const deleteCliente = async (id) => {
  const cliente = await clienteRepository.findById(id);
  if (!cliente) throw new AppError('Cliente no encontrado', 404);

  if (cliente.esMostrador) {
    throw new AppError(
      'El cliente mostrador es el cliente por defecto de las ventas y no se puede eliminar',
      409
    );
  }

  const tieneHistorial = await clienteRepository.hasOrdenes(id);
  if (tieneHistorial) {
    throw new AppError(
      'No se puede eliminar el cliente: tiene órdenes registradas. ' +
      'Los datos del cliente se conservan para mantener el historial de ventas.',
      409
    );
  }

  await clienteRepository.hardDelete(cliente);
  return { eliminado: true };
};

module.exports = {
  listClientes,
  getClienteById,
  getClienteMostrador,
  createCliente,
  updateCliente,
  deleteCliente,
};
