'use strict';

const productoRepository = require('./product.repository');
const { DetalleOrden }   = require('../../config/db');
const AppError           = require('../../helpers/AppError');

const DEFAULT_LIMIT = 20;

const listProductos = async ({ search, activo, page = 1, limit = DEFAULT_LIMIT } = {}) => {
  const parsedPage  = Math.max(parseInt(page, 10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_LIMIT, 1), 100);
  const offset      = (parsedPage - 1) * parsedLimit;

  const activoBool =
    activo === 'true' ? true : activo === 'false' ? false : undefined;

  const { rows, count } = await productoRepository.findAll({
    search,
    activo: activoBool,
    limit: parsedLimit,
    offset,
  });

  return {
    items: rows,
    meta: {
      total: count,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(count / parsedLimit),
    },
  };
};

const getProductoById = async (id) => {
  const producto = await productoRepository.findById(id);
  if (!producto) throw new AppError('Producto no encontrado', 404);
  return producto;
};

/**
 * Crea un nuevo producto.
 * Acepta opcionalmente un array `insumos` para definir la receta en la misma llamada.
 *
 * @param {object} data
 * @param {string} data.nombre
 * @param {string} [data.descripcion]
 * @param {number} data.precioVenta
 * @param {boolean} [data.activo]
 * @param {Array<{insumoId:number, cantidad:number}>} [data.insumos]
 */
const createProducto = async (data) => {
  const existing = await productoRepository.findByNombre(data.nombre);
  if (existing) throw new AppError('Ya existe un producto con ese nombre', 409);

  const transaction = await productoRepository.sequelize.transaction();
  try {
    const producto = await productoRepository.create(
      {
        nombre:      data.nombre,
        descripcion: data.descripcion ?? null,
        precioVenta: data.precioVenta,
        activo:      data.activo ?? true,
      },
      { transaction }
    );

    if (Array.isArray(data.insumos) && data.insumos.length > 0) {
      await productoRepository.setInsumos(producto, data.insumos, transaction);
    }

    await transaction.commit();
    return productoRepository.findById(producto.id);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

const updateProducto = async (id, data) => {
  const producto = await productoRepository.findById(id);
  if (!producto) throw new AppError('Producto no encontrado', 404);

  if (data.nombre && data.nombre !== producto.nombre) {
    const existing = await productoRepository.findByNombre(data.nombre, id);
    if (existing) throw new AppError('Ya existe un producto con ese nombre', 409);
  }

  const updated = await productoRepository.update(producto, {
    nombre:      data.nombre      ?? producto.nombre,
    descripcion: data.descripcion ?? producto.descripcion,
    precioVenta: data.precioVenta ?? producto.precioVenta,
    activo:      typeof data.activo === 'boolean' ? data.activo : producto.activo,
  });

  if (Array.isArray(data.insumos)) {
    await productoRepository.setInsumos(updated, data.insumos);
  }

  return productoRepository.findById(updated.id);
};

/**
 * Elimina un producto.
 * Regla de negocio: si tiene historial en DetalleOrden se desactiva en lugar de eliminar
 * para preservar la integridad de reportes históricos.
 */
const deleteProducto = async (id) => {
  const producto = await productoRepository.findById(id);
  if (!producto) throw new AppError('Producto no encontrado', 404);

  const tieneHistorial = await DetalleOrden.findOne({ where: { productoId: id } });

  if (tieneHistorial) {
    await productoRepository.deactivate(producto);
    return { desactivado: true, eliminado: false };
  }

  await productoRepository.hardDelete(producto);
  return { desactivado: false, eliminado: true };
};

module.exports = {
  listProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
};
