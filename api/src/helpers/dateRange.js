'use strict';

const { Op, fn, col, where: sqlWhere } = require('sequelize');

/**
 * Zona horaria del negocio (nombre IANA). Se usa para decidir a qué día
 * pertenece cada venta, compra o cobro, sin depender de la zona del servidor.
 * Perú no usa horario de verano, así que el valor por defecto es estable.
 */
const TIMEZONE = process.env.APP_TIMEZONE || 'America/Lima';

/**
 * Condiciones Sequelize para "la fecha local del campo está entre
 * fechaDesde y fechaHasta" (ambas inclusivas, formato YYYY-MM-DD).
 *
 * @param {string} columnaSql  Nombre de columna en la BD (ej. 'fecha_de_orden')
 * @returns {Array} condiciones para usar dentro de { [Op.and]: [...] }
 */
const fechaEnRango = (columnaSql, fechaDesde, fechaHasta) => {
  const fechaLocal = fn('DATE', fn('timezone', TIMEZONE, col(columnaSql)));
  const condiciones = [];
  if (fechaDesde) condiciones.push(sqlWhere(fechaLocal, Op.gte, fechaDesde));
  if (fechaHasta) condiciones.push(sqlWhere(fechaLocal, Op.lte, fechaHasta));
  return condiciones;
};

/**
 * Igual que fechaEnRango pero devuelve un objeto listo para hacer spread
 * dentro de un `where` ({} si no hay fechas).
 */
const whereFechas = (columnaSql, fechaDesde, fechaHasta) => {
  const condiciones = fechaEnRango(columnaSql, fechaDesde, fechaHasta);
  return condiciones.length ? { [Op.and]: condiciones } : {};
};

/**
 * Expresión SQL (texto) que convierte un timestamptz a hora local del negocio.
 * Para usar en GROUP BY / TO_CHAR dentro de sequelize.literal.
 */
const sqlFechaLocal = (sequelize, columnaSql) =>
  `timezone(${sequelize.escape(TIMEZONE)}, ${columnaSql})`;

module.exports = { TIMEZONE, fechaEnRango, whereFechas, sqlFechaLocal };
