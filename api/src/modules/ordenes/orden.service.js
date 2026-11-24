'use strict';

const ordenRepository = require('./orden.repository');
const { Producto }    = require('../../config/db');
const AppError        = require('../../helpers/AppError');
const { ESTADO_ORDEN } = require('../../models/Orden');

const DEFAULT_LIMIT = 20;

// ── Máquina de estados válidos ────────────────────────────────────────────────
//
// Define qué transiciones de estado están permitidas.
// Un cajero solo puede mover: pendiente → en_proceso → completado | cancelado
// Un admin puede además anular cualquier orden no completada.
//
const TRANSICIONES_VALIDAS = {
  pendiente:    ['en_proceso', 'cancelado'],
  en_proceso:   ['completado', 'cancelado'],
  completado:   ['anulado'],   // solo admin puede anular una orden completada
  cancelado:    ['anulado'],   // solo admin puede anular
  anulado:      [],            // estado terminal
};

// ── Helpers privados ──────────────────────────────────────────────────────────

/**
 * Valida que los productos del detalle existan y estén activos,
 * y retorna los datos necesarios para calcular el total.
 *
 * @param {Array<{productoId, cantidad}>} items
 * @returns {Array<{productoId, cantidad, precioUnitario, subtotal}>}
 */
const resolverDetalles = async (items) => {
  const ids       = items.map((i) => i.productoId);
  const productos = await Producto.findAll({ where: { id: ids, activo: true } });

  if (productos.length !== ids.length) {
    const encontrados = productos.map((p) => p.id);
    const faltantes   = ids.filter((id) => !encontrados.includes(id));
    throw new AppError(
      `Productos no encontrados o inactivos: [${faltantes.join(', ')}]`,
      422
    );
  }

  const mapaProductos = Object.fromEntries(productos.map((p) => [p.id, p]));

  return items.map((item) => {
    const producto      = mapaProductos[item.productoId];
    const precioUnitario = parseFloat(producto.precioVenta);
    const subtotal       = precioUnitario * item.cantidad;
    return {
      productoId:     item.productoId,
      cantidad:       item.cantidad,
      precioUnitario,
      subtotal,
    };
  });
};

// ── Métodos públicos ──────────────────────────────────────────────────────────

/**
 * Lista órdenes con filtros y paginación.
 * El cajero solo ve las órdenes de su propia sucursal (sucursalId del JWT).
 */
const listOrdenes = async ({
  sucursalId, clienteId, empleadoId,
  estado, fechaDesde, fechaHasta,
  page = 1, limit = DEFAULT_LIMIT,
  usuario, // req.usuario — para restringir al cajero a su sucursal
} = {}) => {
  const parsedPage  = Math.max(parseInt(page,  10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_LIMIT, 1), 100);
  const offset      = (parsedPage - 1) * parsedLimit;

  // Cajero solo ve su sucursal — ignora filtro sucursalId si viene del query
  const sucursalFiltro =
    usuario?.rol === 'caja' ? usuario.sucursalId : sucursalId;

  // Validar estado si viene en el filtro
  if (estado && !ESTADO_ORDEN.includes(estado)) {
    throw new AppError(`Estado inválido. Valores permitidos: ${ESTADO_ORDEN.join(', ')}`, 422);
  }

  const { rows, count } = await ordenRepository.findAll({
    sucursalId: sucursalFiltro,
    clienteId,
    empleadoId,
    estado,
    fechaDesde,
    fechaHasta,
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
 * Obtiene una orden completa por id.
 */
const getOrdenById = async (id, usuario) => {
  const orden = await ordenRepository.findById(id);
  if (!orden) throw new AppError('Orden no encontrada', 404);

  // Cajero solo puede ver órdenes de su sucursal
  if (usuario?.rol === 'caja' && orden.sucursalId !== usuario.sucursalId) {
    throw new AppError('No tienes acceso a esta orden', 403);
  }

  return orden;
};

/**
 * Crea una nueva orden con sus detalles en una sola transacción.
 *
 * @param {object} data
 * @param {number}   data.clienteId
 * @param {number}   data.sucursalId
 * @param {number}   data.empleadoId
 * @param {Array}    data.detalles   - [{ productoId, cantidad }]
 * @param {object}   usuario         - req.usuario
 */
const createOrden = async (data, usuario) => {
  // El cajero solo puede crear órdenes en su propia sucursal
  if (usuario.rol === 'caja' && data.sucursalId !== usuario.sucursalId) {
    throw new AppError('Solo puedes crear órdenes en tu sucursal asignada', 403);
  }

  if (!data.detalles || data.detalles.length === 0) {
    throw new AppError('La orden debe tener al menos un producto', 422);
  }

  // Validar y resolver productos → obtiene precios actuales
  const detallesResueltos = await resolverDetalles(data.detalles);
  const total = detallesResueltos.reduce((sum, d) => sum + d.subtotal, 0);

  const transaction = await ordenRepository.sequelize.transaction();
  try {
    // 1. Crear cabecera
    const orden = await ordenRepository.create(
      {
        clienteId:   data.clienteId,
        sucursalId:  data.sucursalId,
        empleadoId:  data.empleadoId,
        fechaDeOrden: new Date(),
        estado:      'pendiente',
        total:       parseFloat(total.toFixed(2)),
      },
      transaction
    );

    // 2. Crear detalles con ordenId
    await ordenRepository.createDetalles(
      detallesResueltos.map((d) => ({ ...d, ordenId: orden.id })),
      transaction
    );

    await transaction.commit();
    return ordenRepository.findById(orden.id);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

/**
 * Actualiza los detalles de una orden (solo si está en estado 'pendiente').
 * Reemplaza todos los detalles y recalcula el total.
 */
const updateOrden = async (id, data, usuario) => {
  const orden = await ordenRepository.findById(id);
  if (!orden) throw new AppError('Orden no encontrada', 404);

  if (orden.estado !== 'pendiente') {
    throw new AppError(
      `Solo se pueden editar órdenes en estado "pendiente". Estado actual: "${orden.estado}"`,
      409
    );
  }

  if (usuario.rol === 'caja' && orden.sucursalId !== usuario.sucursalId) {
    throw new AppError('No tienes acceso a esta orden', 403);
  }

  if (!data.detalles || data.detalles.length === 0) {
    throw new AppError('La orden debe tener al menos un producto', 422);
  }

  const detallesResueltos = await resolverDetalles(data.detalles);
  const total = detallesResueltos.reduce((sum, d) => sum + d.subtotal, 0);

  const transaction = await ordenRepository.sequelize.transaction();
  try {
    // Reemplazar todos los detalles
    await ordenRepository.deleteDetalles(orden.id, transaction);
    await ordenRepository.createDetalles(
      detallesResueltos.map((d) => ({ ...d, ordenId: orden.id })),
      transaction
    );
    await ordenRepository.updateTotal(orden, parseFloat(total.toFixed(2)), transaction);

    await transaction.commit();
    return ordenRepository.findById(orden.id);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

/**
 * Cambia el estado de una orden validando la máquina de estados.
 *
 * Solo admin puede anular una orden completada o cancelada.
 * El cajero puede mover: pendiente → en_proceso → completado | cancelado.
 */
const cambiarEstado = async (id, nuevoEstado, usuario) => {
  const orden = await ordenRepository.findById(id);
  if (!orden) throw new AppError('Orden no encontrada', 404);

  if (usuario.rol === 'caja' && orden.sucursalId !== usuario.sucursalId) {
    throw new AppError('No tienes acceso a esta orden', 403);
  }

  const transicionesPermitidas = TRANSICIONES_VALIDAS[orden.estado] ?? [];

  if (!transicionesPermitidas.includes(nuevoEstado)) {
    throw new AppError(
      `Transición de estado inválida: "${orden.estado}" → "${nuevoEstado}". ` +
      `Transiciones permitidas desde "${orden.estado}": [${transicionesPermitidas.join(', ') || 'ninguna'}]`,
      409
    );
  }

  // Solo admin puede anular
  if (nuevoEstado === 'anulado' && usuario.rol !== 'admin') {
    throw new AppError('Solo el administrador puede anular órdenes', 403);
  }

  const transaction = await ordenRepository.sequelize.transaction();
  try {
    await ordenRepository.updateEstado(orden, nuevoEstado, transaction);
    await transaction.commit();
    return ordenRepository.findById(orden.id);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

module.exports = {
  listOrdenes,
  getOrdenById,
  createOrden,
  updateOrden,
  cambiarEstado,
};
