'use strict';

const insumoRepository = require('./insumo.repository');
const AppError         = require('../../helpers/AppError');

const DEFAULT_LIMIT = 20;

/**
 * Lista insumos con paginación y filtros.
 *
 * @param {object} query
 * @param {string} query.search     - Búsqueda por nombre
 * @param {string} query.stockBajo  - Si se pasa, filtra insumos con stock <= este valor
 * @param {number} query.page
 * @param {number} query.limit
 */
const listInsumos = async ({ search, stockBajo, page = 1, limit = DEFAULT_LIMIT } = {}) => {
  const parsedPage  = Math.max(parseInt(page,  10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_LIMIT, 1), 100);
  const offset      = (parsedPage - 1) * parsedLimit;

  const stockBajoNum = stockBajo !== undefined ? parseFloat(stockBajo) : undefined;

  const { rows, count } = await insumoRepository.findAll({
    search,
    stockBajo: !isNaN(stockBajoNum) ? stockBajoNum : undefined,
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
 * Obtiene un insumo por id con los productos que lo usan.
 */
const getInsumoById = async (id) => {
  const insumo = await insumoRepository.findById(id);
  if (!insumo) throw new AppError('Insumo no encontrado', 404);
  return insumo;
};

/**
 * Crea un nuevo insumo.
 */
const createInsumo = async (data) => {
  const existing = await insumoRepository.findByNombre(data.nombre);
  if (existing) throw new AppError('Ya existe un insumo con ese nombre', 409);

  return insumoRepository.create({
    nombre: data.nombre,
    unidad: data.unidad,
    stock:  data.stock ?? 0,
  });
};

/**
 * Actualiza un insumo existente.
 * El stock se actualiza vía adjustStock (compras/ajustes manuales),
 * pero aquí también se permite editar directamente para correcciones administrativas.
 */
const updateInsumo = async (id, data) => {
  const insumo = await insumoRepository.findById(id);
  if (!insumo) throw new AppError('Insumo no encontrado', 404);

  if (data.nombre && data.nombre !== insumo.nombre) {
    const existing = await insumoRepository.findByNombre(data.nombre, id);
    if (existing) throw new AppError('Ya existe un insumo con ese nombre', 409);
  }

  if (data.stock !== undefined && parseFloat(data.stock) < 0) {
    throw new AppError('El stock no puede ser negativo', 422);
  }

  return insumoRepository.update(insumo, {
    nombre: data.nombre ?? insumo.nombre,
    unidad: data.unidad ?? insumo.unidad,
    stock:  data.stock  ?? insumo.stock,
  });
};

/**
 * Ajuste manual de stock (entrada o salida).
 * Usado para correcciones administrativas o mermas.
 *
 * @param {number} id         - Id del insumo
 * @param {number} cantidad   - Positivo para entrada, negativo para salida
 * @param {string} tipo       - 'entrada' | 'salida' (informativo, para validación)
 */
const ajustarStock = async (id, cantidad, tipo) => {
  const insumo = await insumoRepository.findById(id);
  if (!insumo) throw new AppError('Insumo no encontrado', 404);

  if (tipo === 'salida' && cantidad > 0) {
    throw new AppError('Para una salida, la cantidad debe ser negativa', 422);
  }
  if (tipo === 'entrada' && cantidad < 0) {
    throw new AppError('Para una entrada, la cantidad debe ser positiva', 422);
  }

  return insumoRepository.adjustStock(insumo, cantidad);
};

/**
 * Elimina un insumo.
 *
 * Reglas de negocio:
 * - Si está en la receta de algún producto → no se elimina (rompe la receta)
 * - Si tiene historial en detalle_compras → no se elimina (preserva reportes)
 * - Sin referencias → eliminación física
 */
const deleteInsumo = async (id) => {
  const insumo = await insumoRepository.findById(id);
  if (!insumo) throw new AppError('Insumo no encontrado', 404);

  const enReceta = await insumoRepository.hasProductos(id);
  if (enReceta) {
    throw new AppError(
      'No se puede eliminar el insumo: está en la receta de uno o más productos. ' +
      'Retíralo de las recetas primero.',
      409
    );
  }

  const tieneHistorial = await insumoRepository.hasDetalleCompras(id);
  if (tieneHistorial) {
    throw new AppError(
      'No se puede eliminar el insumo: tiene compras registradas. ' +
      'Los datos del insumo se conservan para mantener el historial de egresos.',
      409
    );
  }

  await insumoRepository.hardDelete(insumo);
  return { eliminado: true };
};

module.exports = {
  listInsumos,
  getInsumoById,
  createInsumo,
  updateInsumo,
  ajustarStock,
  deleteInsumo,
};
