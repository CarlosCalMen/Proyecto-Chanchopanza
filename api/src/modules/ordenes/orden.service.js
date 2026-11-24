'use strict';

const ordenRepository  = require('./orden.repository');
const stock            = require('../insumos/insumo.stock');
const { Producto, Cliente, Sucursal } = require('../../config/db');
const AppError         = require('../../helpers/AppError');
const { ESTADO_ORDEN } = require('../../models/Orden');

const DEFAULT_LIMIT = 20;

// ── Máquina de estados ────────────────────────────────────────────────────────
//
//   pendiente  → en_proceso | cancelado
//   en_proceso → cancelado
//   completado → anulado   (solo admin)
//   cancelado  → anulado   (solo admin)
//
// IMPORTANTE: una orden pasa a 'completado' únicamente al registrar su cobro
// (POST /ordenes/:id/pago). No se puede completar manualmente.
//
const TRANSICIONES_VALIDAS = {
  pendiente:  ['en_proceso', 'cancelado'],
  en_proceso: ['cancelado'],
  completado: ['anulado'],
  cancelado:  ['anulado'],
  anulado:    [],
};

const round2 = (n) => Math.round(n * 100) / 100;

// ── Helpers privados ──────────────────────────────────────────────────────────

/**
 * Determina sucursal y empleado de una orden nueva.
 *  - El empleado SIEMPRE sale del token (no se acepta del body).
 *  - El cajero solo opera en su sucursal; el admin puede elegir otra.
 */
const resolverContexto = (data, usuario) => {
  if (!usuario.empleadoId) {
    throw new AppError(
      'Tu usuario no tiene un empleado asociado y no puede registrar operaciones. ' +
      'Si acabas de recibir el acceso, cierra sesión y vuelve a entrar.',
      409
    );
  }

  const sucursalBody = data.sucursalId ? Number(data.sucursalId) : null;
  let sucursalId;

  if (usuario.rol === 'caja') {
    if (sucursalBody && sucursalBody !== usuario.sucursalId) {
      throw new AppError('Solo puedes crear órdenes en tu sucursal asignada', 403);
    }
    sucursalId = usuario.sucursalId;
  } else {
    sucursalId = sucursalBody ?? usuario.sucursalId;
  }

  if (!sucursalId) throw new AppError('El sucursalId es requerido', 422);
  return { sucursalId, empleadoId: usuario.empleadoId };
};

/**
 * Valida productos activos y toma su precio actual como snapshot.
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
    const precioUnitario = parseFloat(mapaProductos[item.productoId].precioVenta);
    return {
      productoId: item.productoId,
      cantidad:   item.cantidad,
      precioUnitario,
      subtotal:   round2(precioUnitario * item.cantidad),
    };
  });
};

const calcularTotal = (detalles) =>
  round2(detalles.reduce((sum, d) => sum + d.subtotal, 0));

const soloProductoYCantidad = (detalles) =>
  detalles.map((d) => ({ productoId: d.productoId, cantidad: d.cantidad }));

const verificarAccesoSucursal = (orden, usuario) => {
  if (usuario?.rol === 'caja' && orden.sucursalId !== usuario.sucursalId) {
    throw new AppError('No tienes acceso a esta orden', 403);
  }
};

// Importes en CENTAVOS (enteros) para que las sumas nunca arrastren errores de decimales
const toCents = (n) => Math.round(Number(n) * 100);
const fmt     = (cents) => (cents / 100).toFixed(2);

/**
 * Convierte lo que envía el cliente en filas de pago validadas.
 *
 * Dos formatos:
 *   - Dividido: { pagos: [{ metodoPago, monto, montoRecibido? }, ...] }
 *   - Pago único (formato anterior): { metodoPago, montoRecibido? } → cubre el total
 *
 * Reglas:
 *   - La suma de los montos debe ser EXACTAMENTE el total de la orden.
 *   - montoRecibido solo aplica a efectivo (si falta, se asume exacto) y no
 *     puede ser menor al monto de ese pago; la diferencia es el vuelto.
 *   - En tarjeta, yape, plin y transferencia no hay vuelto.
 *   - Se puede repetir un método (p. ej. dos pagos con Yape).
 */
const prepararPagos = (data, totalC) => {
  const esDividido = Array.isArray(data.pagos);
  const entradas = esDividido
    ? data.pagos
    : [{ metodoPago: data.metodoPago, monto: totalC / 100, montoRecibido: data.montoRecibido }];

  const filas = entradas.map((e, i) => {
    const montoC = toCents(e.monto);
    if (esDividido && !(montoC > 0)) {
      throw new AppError(`Pago ${i + 1}: el monto debe ser mayor a 0`, 422);
    }

    const esEfectivo = e.metodoPago === 'efectivo';
    const tieneRecibido = esEfectivo && e.montoRecibido !== undefined && e.montoRecibido !== null;
    const recibidoC = tieneRecibido ? toCents(e.montoRecibido) : montoC;

    if (recibidoC < montoC) {
      throw new AppError(
        `Pago ${i + 1} (efectivo): el monto recibido (${fmt(recibidoC)}) es menor al monto a cobrar (${fmt(montoC)})`,
        422
      );
    }

    return { metodoPago: e.metodoPago, montoC, recibidoC, vueltoC: recibidoC - montoC };
  });

  const sumaC = filas.reduce((acc, f) => acc + f.montoC, 0);
  if (sumaC !== totalC) {
    const dif = totalC - sumaC;
    throw new AppError(
      dif > 0
        ? `Los pagos suman ${fmt(sumaC)} y el total de la orden es ${fmt(totalC)} (faltan ${fmt(dif)})`
        : `Los pagos suman ${fmt(sumaC)} y exceden el total de la orden (${fmt(totalC)}) por ${fmt(-dif)}`,
      422
    );
  }

  return filas;
};

/**
 * Convierte las filas validadas en registros de la tabla pagos.
 * Todos los pagos de un mismo cobro comparten la misma fecha y hora.
 */
const registrosDePago = (ordenId, filas, usuario) => {
  const ahora = new Date();
  return filas.map((f) => ({
    ordenId,
    empleadoId:    usuario.empleadoId,
    metodoPago:    f.metodoPago,
    monto:         f.montoC / 100,
    montoRecibido: f.recibidoC / 100,
    vuelto:        f.vueltoC / 100,
    estado:        'registrado',
    fechaDePago:   ahora,
  }));
};

// ── Métodos públicos ──────────────────────────────────────────────────────────

const listOrdenes = async ({
  sucursalId, clienteId, empleadoId,
  estado, fechaDesde, fechaHasta,
  page = 1, limit = DEFAULT_LIMIT,
  usuario,
} = {}) => {
  const parsedPage  = Math.max(parseInt(page,  10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_LIMIT, 1), 100);
  const offset      = (parsedPage - 1) * parsedLimit;

  // El cajero solo ve su sucursal, ignorando el filtro del query
  const sucursalFiltro = usuario?.rol === 'caja' ? usuario.sucursalId : sucursalId;

  if (estado && !ESTADO_ORDEN.includes(estado)) {
    throw new AppError(`Estado inválido. Valores permitidos: ${ESTADO_ORDEN.join(', ')}`, 422);
  }

  const { rows, count } = await ordenRepository.findAll({
    sucursalId: sucursalFiltro,
    clienteId, empleadoId, estado, fechaDesde, fechaHasta,
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

const getOrdenById = async (id, usuario) => {
  const orden = await ordenRepository.findById(id);
  if (!orden) throw new AppError('Orden no encontrada', 404);
  verificarAccesoSucursal(orden, usuario);
  return orden;
};

/**
 * Crea una orden, sus detalles y reserva el stock de insumos,
 * todo en una sola transacción.
 */
const createOrden = async (data, usuario) => {
  const { sucursalId, empleadoId } = resolverContexto(data, usuario);

  if (!data.detalles || data.detalles.length === 0) {
    throw new AppError('La orden debe tener al menos un producto', 422);
  }

  const sucursal = await Sucursal.findByPk(sucursalId);
  if (!sucursal || !sucursal.activo) throw new AppError('Sucursal no encontrada o inactiva', 422);

  // Sin clienteId la venta es al cliente mostrador ('Cliente Rápido')
  const cliente = data.clienteId == null
    ? await Cliente.findOne({ where: { esMostrador: true } })
    : await Cliente.findByPk(data.clienteId);
  if (!cliente) {
    throw new AppError(
      data.clienteId == null
        ? 'No hay un cliente mostrador configurado: indica un clienteId'
        : 'Cliente no encontrado',
      data.clienteId == null ? 409 : 422
    );
  }

  const detalles = await resolverDetalles(data.detalles);
  const total    = calcularTotal(detalles);

  // Cobro en la misma operación (opcional). Se valida ANTES de tocar la base de datos.
  const cobraAlInstante = Array.isArray(data.pagos) || data.metodoPago !== undefined;
  const filasPago = cobraAlInstante ? prepararPagos(data, toCents(total)) : null;

  const transaction = await ordenRepository.sequelize.transaction();
  try {
    const orden = await ordenRepository.create(
      {
        clienteId:    cliente.id,
        sucursalId,
        empleadoId,
        fechaDeOrden: new Date(),
        estado:       filasPago ? 'completado' : 'pendiente',
        total,
      },
      transaction
    );

    await ordenRepository.createDetalles(
      detalles.map((d) => ({ ...d, ordenId: orden.id })),
      transaction
    );

    await stock.descontar(soloProductoYCantidad(detalles), transaction);

    if (filasPago) {
      await ordenRepository.createPagos(registrosDePago(orden.id, filasPago, usuario), transaction);
    }

    await transaction.commit();
    return ordenRepository.findById(orden.id);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

/**
 * Reemplaza los detalles de una orden 'pendiente'.
 * Devuelve al stock lo anterior y reserva lo nuevo.
 */
const updateOrden = async (id, data, usuario) => {
  const orden = await ordenRepository.findById(id);
  if (!orden) throw new AppError('Orden no encontrada', 404);
  verificarAccesoSucursal(orden, usuario);

  if (orden.estado !== 'pendiente') {
    throw new AppError(
      `Solo se pueden editar órdenes en estado "pendiente". Estado actual: "${orden.estado}"`,
      409
    );
  }

  if (!data.detalles || data.detalles.length === 0) {
    throw new AppError('La orden debe tener al menos un producto', 422);
  }

  const detalles = await resolverDetalles(data.detalles);
  const total    = calcularTotal(detalles);

  const transaction = await ordenRepository.sequelize.transaction();
  try {
    await stock.restituir(soloProductoYCantidad(orden.detalles), transaction);

    await ordenRepository.deleteDetalles(orden.id, transaction);
    await ordenRepository.createDetalles(
      detalles.map((d) => ({ ...d, ordenId: orden.id })),
      transaction
    );
    await ordenRepository.updateTotal(orden, total, transaction);

    await stock.descontar(soloProductoYCantidad(detalles), transaction);

    await transaction.commit();
    return ordenRepository.findById(orden.id);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

/**
 * Cambia el estado validando la máquina de estados.
 *
 * Efectos:
 *   → cancelado                      : devuelve el stock
 *   completado → anulado             : devuelve el stock y anula el cobro
 *   cancelado  → anulado             : sin efectos (el stock ya se devolvió)
 */
const cambiarEstado = async (id, nuevoEstado, usuario) => {
  const orden = await ordenRepository.findById(id);
  if (!orden) throw new AppError('Orden no encontrada', 404);
  verificarAccesoSucursal(orden, usuario);

  if (nuevoEstado === 'completado') {
    throw new AppError(
      'Una orden se completa al registrar su cobro: usa POST /ordenes/:id/pago',
      409
    );
  }

  const permitidas = TRANSICIONES_VALIDAS[orden.estado] ?? [];
  if (!permitidas.includes(nuevoEstado)) {
    throw new AppError(
      `Transición de estado inválida: "${orden.estado}" → "${nuevoEstado}". ` +
      `Transiciones permitidas desde "${orden.estado}": [${permitidas.join(', ') || 'ninguna'}]`,
      409
    );
  }

  if (nuevoEstado === 'anulado' && usuario.rol !== 'admin') {
    throw new AppError('Solo el administrador puede anular órdenes', 403);
  }

  const transaction = await ordenRepository.sequelize.transaction();
  try {
    // Releer con bloqueo para que dos cambios simultáneos no devuelvan el stock dos veces
    const bloqueada = await ordenRepository.findByIdForUpdate(id, transaction);
    if (bloqueada.estado !== orden.estado) {
      throw new AppError('La orden cambió de estado mientras la procesabas. Recárgala e intenta de nuevo.', 409);
    }

    const devolverStock =
      nuevoEstado === 'cancelado' ||
      (nuevoEstado === 'anulado' && orden.estado === 'completado');

    if (devolverStock) {
      await stock.restituir(soloProductoYCantidad(orden.detalles), transaction);
    }
    if (nuevoEstado === 'anulado' && orden.estado === 'completado') {
      await ordenRepository.anularPagos(orden.id, transaction);
    }

    await ordenRepository.updateEstado(orden, nuevoEstado, transaction);
    await transaction.commit();
    return ordenRepository.findById(orden.id);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

/**
 * Registra el cobro de la orden (simple o dividido en varios métodos) y la completa.
 * Todo o nada: si algo falla, no queda ningún pago registrado.
 *
 * @param {object} data
 * @param {Array}  [data.pagos]          [{ metodoPago, monto, montoRecibido? }]
 * @param {string} [data.metodoPago]     formato anterior: pago único por el total
 * @param {number} [data.montoRecibido]  formato anterior, solo efectivo
 */
const registrarPago = async (id, data, usuario) => {
  if (!usuario.empleadoId) {
    throw new AppError('Tu usuario no tiene un empleado asociado y no puede registrar cobros', 409);
  }

  const orden = await ordenRepository.findById(id);
  if (!orden) throw new AppError('Orden no encontrada', 404);
  verificarAccesoSucursal(orden, usuario);

  const totalC = toCents(orden.total);
  const filas  = prepararPagos(data, totalC);

  const transaction = await ordenRepository.sequelize.transaction();
  try {
    // Bloqueo: si dos cajeros cobran la misma orden a la vez, el segundo espera y falla limpio
    const bloqueada = await ordenRepository.findByIdForUpdate(id, transaction);
    if (!['pendiente', 'en_proceso'].includes(bloqueada.estado)) {
      throw new AppError(
        `No se puede cobrar una orden en estado "${bloqueada.estado}"`,
        409
      );
    }
    if (toCents(bloqueada.total) !== totalC) {
      throw new AppError(
        'El total de la orden cambió mientras cobrabas. Recarga la orden e intenta de nuevo.',
        409
      );
    }

    await ordenRepository.createPagos(registrosDePago(orden.id, filas, usuario), transaction);

    await ordenRepository.updateEstado(orden, 'completado', transaction);

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
  registrarPago,
};
