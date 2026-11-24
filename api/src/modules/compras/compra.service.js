'use strict';

const compraRepository  = require('./compra.repository');
const { Insumo, Proveedor, Sucursal } = require('../../config/db');
const AppError          = require('../../helpers/AppError');
const { ESTADO_COMPRA } = require('../../models/Compra');

const DEFAULT_LIMIT = 20;

// ── Máquina de estados ────────────────────────────────────────────────────────
//
// pendiente → recibido | cancelado
// recibido  → anulado  (solo admin — revierte stock)
// cancelado → anulado  (solo admin)
// anulado   → (terminal)
//
const TRANSICIONES_VALIDAS = {
  pendiente: ['recibido', 'cancelado'],
  recibido:  ['anulado'],
  cancelado: ['anulado'],
  anulado:   [],
};

// ── Helpers privados ──────────────────────────────────────────────────────────

/**
 * Valida que los insumos del detalle existan,
 * y retorna los datos necesarios para calcular el total.
 *
 * @param {Array<{insumoId, cantidad, costoUnitario}>} items
 * @returns {Array<{insumoId, cantidad, costoUnitario, subtotal}>}
 */
const resolverDetalles = async (items) => {
  const ids     = items.map((i) => i.insumoId);
  const insumos = await Insumo.findAll({ where: { id: ids } });

  if (insumos.length !== ids.length) {
    const encontrados = insumos.map((i) => i.id);
    const faltantes   = ids.filter((id) => !encontrados.includes(id));
    throw new AppError(
      `Insumos no encontrados: [${faltantes.join(', ')}]`,
      422
    );
  }

  return items.map((item) => ({
    insumoId:     item.insumoId,
    cantidad:     parseFloat(item.cantidad),
    costoUnitario: parseFloat(item.costoUnitario),
    subtotal:     parseFloat((item.cantidad * item.costoUnitario).toFixed(2)),
  }));
};

/**
 * Incrementa el stock de cada insumo al recibir una compra.
 */
const incrementarStock = async (detalles, transaction) => {
  await Promise.all(
    detalles.map(async (d) => {
      const insumo = await Insumo.findByPk(d.insumoId, { transaction });
      const nuevoStock = parseFloat(insumo.stock) + parseFloat(d.cantidad);
      return insumo.update({ stock: nuevoStock }, { transaction });
    })
  );
};

/**
 * Revierte el stock de cada insumo al anular una compra recibida.
 */
const revertirStock = async (detalles, transaction) => {
  await Promise.all(
    detalles.map(async (d) => {
      const insumo = await Insumo.findByPk(d.insumoId, { transaction });
      const nuevoStock = parseFloat(insumo.stock) - parseFloat(d.cantidad);
      if (nuevoStock < 0) {
        throw new AppError(
          `No se puede anular la compra: el stock de "${insumo.nombre}" ` +
          `quedaría en ${nuevoStock.toFixed(3)} ${insumo.unidad}. ` +
          'Puede que parte del insumo ya haya sido consumido.',
          409
        );
      }
      return insumo.update({ stock: nuevoStock }, { transaction });
    })
  );
};

// ── Métodos públicos ──────────────────────────────────────────────────────────

/**
 * Lista compras con filtros y paginación.
 */
const listCompras = async ({
  sucursalId, proveedorId, empleadoId,
  estado, fechaDesde, fechaHasta,
  page = 1, limit = DEFAULT_LIMIT,
} = {}) => {
  const parsedPage  = Math.max(parseInt(page,  10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_LIMIT, 1), 100);
  const offset      = (parsedPage - 1) * parsedLimit;

  if (estado && !ESTADO_COMPRA.includes(estado)) {
    throw new AppError(`Estado inválido. Valores permitidos: ${ESTADO_COMPRA.join(', ')}`, 422);
  }

  const { rows, count } = await compraRepository.findAll({
    sucursalId,
    proveedorId,
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
 * Obtiene una compra completa por id.
 */
const getCompraById = async (id) => {
  const compra = await compraRepository.findById(id);
  if (!compra) throw new AppError('Compra no encontrada', 404);
  return compra;
};

/**
 * Crea una nueva compra con sus detalles.
 * El stock NO se actualiza al crear — solo al pasar a estado 'recibido'.
 *
 * El empleado sale del token. La sucursal es opcional en el body
 * (si falta, se usa la del usuario).
 *
 * @param {object} data
 * @param {number}   data.proveedorId
 * @param {number}   [data.sucursalId]
 * @param {Array}    data.detalles  - [{ insumoId, cantidad, costoUnitario }]
 * @param {object} usuario - req.usuario
 */
const createCompra = async (data, usuario) => {
  if (!usuario.empleadoId) {
    throw new AppError(
      'Tu usuario no tiene un empleado asociado y no puede registrar operaciones. ' +
      'Si acabas de recibir el acceso, cierra sesión y vuelve a entrar.',
      409
    );
  }

  const sucursalId = data.sucursalId ? Number(data.sucursalId) : usuario.sucursalId;
  if (!sucursalId) throw new AppError('El sucursalId es requerido', 422);

  if (!data.detalles || data.detalles.length === 0) {
    throw new AppError('La compra debe tener al menos un insumo', 422);
  }

  const sucursal = await Sucursal.findByPk(sucursalId);
  if (!sucursal || !sucursal.activo) throw new AppError('Sucursal no encontrada o inactiva', 422);

  const proveedor = await Proveedor.findByPk(data.proveedorId);
  if (!proveedor) throw new AppError('Proveedor no encontrado', 422);

  const detallesResueltos = await resolverDetalles(data.detalles);
  const total = detallesResueltos.reduce((sum, d) => sum + d.subtotal, 0);

  const transaction = await compraRepository.sequelize.transaction();
  try {
    const compra = await compraRepository.create(
      {
        proveedorId:   data.proveedorId,
        sucursalId,
        empleadoId:    usuario.empleadoId,
        fechaDeCompra: new Date(),
        estado:        'pendiente',
        total:         parseFloat(total.toFixed(2)),
      },
      transaction
    );

    await compraRepository.createDetalles(
      detallesResueltos.map((d) => ({ ...d, compraId: compra.id })),
      transaction
    );

    await transaction.commit();
    return compraRepository.findById(compra.id);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

/**
 * Actualiza los detalles de una compra (solo si está en estado 'pendiente').
 */
const updateCompra = async (id, data) => {
  const compra = await compraRepository.findById(id);
  if (!compra) throw new AppError('Compra no encontrada', 404);

  if (compra.estado !== 'pendiente') {
    throw new AppError(
      `Solo se pueden editar compras en estado "pendiente". Estado actual: "${compra.estado}"`,
      409
    );
  }

  if (!data.detalles || data.detalles.length === 0) {
    throw new AppError('La compra debe tener al menos un insumo', 422);
  }

  const detallesResueltos = await resolverDetalles(data.detalles);
  const total = detallesResueltos.reduce((sum, d) => sum + d.subtotal, 0);

  const transaction = await compraRepository.sequelize.transaction();
  try {
    await compraRepository.deleteDetalles(compra.id, transaction);
    await compraRepository.createDetalles(
      detallesResueltos.map((d) => ({ ...d, compraId: compra.id })),
      transaction
    );
    await compraRepository.updateTotal(compra, parseFloat(total.toFixed(2)), transaction);

    await transaction.commit();
    return compraRepository.findById(compra.id);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

/**
 * Cambia el estado de una compra validando la máquina de estados.
 *
 * Efectos sobre stock:
 *   pendiente → recibido  : incrementa stock de cada insumo
 *   recibido  → anulado   : revierte stock (verifica que no quede negativo)
 *   pendiente → cancelado : sin efecto en stock
 *   cancelado → anulado   : sin efecto en stock
 */
const cambiarEstado = async (id, nuevoEstado, usuario) => {
  const compra = await compraRepository.findById(id);
  if (!compra) throw new AppError('Compra no encontrada', 404);

  const transicionesPermitidas = TRANSICIONES_VALIDAS[compra.estado] ?? [];

  if (!transicionesPermitidas.includes(nuevoEstado)) {
    throw new AppError(
      `Transición de estado inválida: "${compra.estado}" → "${nuevoEstado}". ` +
      `Transiciones permitidas desde "${compra.estado}": [${transicionesPermitidas.join(', ') || 'ninguna'}]`,
      409
    );
  }

  // Solo admin puede anular
  if (nuevoEstado === 'anulado' && usuario.rol !== 'admin') {
    throw new AppError('Solo el administrador puede anular compras', 403);
  }

  const transaction = await compraRepository.sequelize.transaction();
  try {
    // Efecto sobre stock según transición
    if (nuevoEstado === 'recibido') {
      await incrementarStock(compra.detalles, transaction);
    } else if (nuevoEstado === 'anulado' && compra.estado === 'recibido') {
      await revertirStock(compra.detalles, transaction);
    }

    await compraRepository.updateEstado(compra, nuevoEstado, transaction);
    await transaction.commit();
    return compraRepository.findById(compra.id);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

module.exports = {
  listCompras,
  getCompraById,
  createCompra,
  updateCompra,
  cambiarEstado,
};
