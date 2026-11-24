'use strict';

/**
 * Movimientos automáticos de stock de insumos según la receta de los productos.
 *
 * Regla de negocio:
 *   El stock se RESERVA al crear la orden y se DEVUELVE si la orden se cancela
 *   o se anula. Así, si falta un insumo, el problema se detecta al tomar el
 *   pedido ("no hay pollo") y no cuando el cliente ya comió.
 *
 * Todas las funciones deben ejecutarse dentro de una transacción: bloquean
 * las filas de insumos (SELECT ... FOR UPDATE) para que dos órdenes
 * simultáneas no consuman el mismo stock.
 *
 * Los productos sin receta (por ejemplo un postre sin insumos registrados)
 * simplemente no descuentan nada.
 */

const { Insumo, InsumoProducto } = require('../../config/db');
const AppError = require('../../helpers/AppError');

const redondear = (n) => Math.round(n * 1000) / 1000; // stock tiene 3 decimales

/**
 * Calcula cuánto de cada insumo consumen los detalles de una orden.
 * @param {Array<{productoId:number, cantidad:number}>} detalles
 * @returns {Promise<Map<number, number>>} insumoId -> cantidad total
 */
const calcularConsumo = async (detalles, transaction) => {
  const productoIds = [...new Set(detalles.map((d) => d.productoId))];
  const recetas = await InsumoProducto.findAll({
    where: { productoId: productoIds },
    transaction,
  });

  const consumo = new Map();
  for (const d of detalles) {
    for (const r of recetas.filter((x) => x.productoId === d.productoId)) {
      const previo = consumo.get(r.insumoId) || 0;
      consumo.set(r.insumoId, previo + parseFloat(r.cantidad) * d.cantidad);
    }
  }
  return consumo;
};

/**
 * Bloquea y devuelve los insumos, ordenados por id para evitar deadlocks.
 */
const bloquearInsumos = (ids, transaction) =>
  Insumo.findAll({
    where: { id: ids },
    order: [['id', 'ASC']],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

/**
 * Descuenta del stock los insumos que consumen los detalles.
 * Lanza AppError 409 (con el detalle de lo que falta) si no alcanza.
 */
const descontar = async (detalles, transaction) => {
  const consumo = await calcularConsumo(detalles, transaction);
  if (consumo.size === 0) return;

  const insumos = await bloquearInsumos([...consumo.keys()], transaction);

  const faltantes = insumos
    .filter((i) => parseFloat(i.stock) < redondear(consumo.get(i.id)))
    .map((i) => ({
      insumoId:   i.id,
      nombre:     i.nombre,
      unidad:     i.unidad,
      requerido:  redondear(consumo.get(i.id)),
      disponible: parseFloat(i.stock),
    }));

  if (faltantes.length > 0) {
    throw new AppError(
      'Stock insuficiente para completar la orden: ' +
        faltantes
          .map((f) => `${f.nombre} (necesita ${f.requerido} ${f.unidad}, hay ${f.disponible})`)
          .join('; '),
      409,
      faltantes
    );
  }

  for (const i of insumos) {
    await i.update(
      { stock: redondear(parseFloat(i.stock) - consumo.get(i.id)) },
      { transaction }
    );
  }
};

/**
 * Devuelve al stock los insumos de unos detalles (cancelación, anulación
 * o edición de la orden).
 */
const restituir = async (detalles, transaction) => {
  const consumo = await calcularConsumo(detalles, transaction);
  if (consumo.size === 0) return;

  const insumos = await bloquearInsumos([...consumo.keys()], transaction);
  for (const i of insumos) {
    await i.update(
      { stock: redondear(parseFloat(i.stock) + consumo.get(i.id)) },
      { transaction }
    );
  }
};

module.exports = { descontar, restituir };
