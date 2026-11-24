'use strict';

const { Sequelize } = require('sequelize');

// ── Models ────────────────────────────────────────────────────────────────────
const Perfil        = require('../models/Perfil');
const Sucursal      = require('../models/Sucursal');
const Usuario       = require('../models/Usuario');
const Empleado      = require('../models/Empleado');
const Cliente       = require('../models/Cliente');
const Producto      = require('../models/Producto');
const Insumo        = require('../models/Insumo');
const InsumoProducto= require('../models/InsumoProducto');
const Proveedor     = require('../models/Proveedor');
const Orden         = require('../models/Orden');
const DetalleOrden  = require('../models/DetalleOrden');  // ← ruta corregida
const Compra        = require('../models/Compra');
const DetalleCompra = require('../models/DetalleCompra'); // ← sin espacio espúreo

// ── Sequelize instance ────────────────────────────────────────────────────────
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host:    process.env.DB_HOST || 'localhost',
    port:    process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      underscored: true,
      timestamps:  true,
    },
    pool: {
      max:     10,
      min:     0,
      acquire: 30000,
      idle:    10000,
    },
  }
);

// ── Model initialization ──────────────────────────────────────────────────────
Perfil.init(sequelize);
Sucursal.init(sequelize);
Usuario.init(sequelize);
Empleado.init(sequelize);
Cliente.init(sequelize);
Producto.init(sequelize);
Insumo.init(sequelize);
InsumoProducto.init(sequelize);
Proveedor.init(sequelize);
Orden.init(sequelize);
DetalleOrden.init(sequelize);
Compra.init(sequelize);
DetalleCompra.init(sequelize);           // ← sin espacio espúreo

// ── Associations ──────────────────────────────────────────────────────────────
//
// Convención:
//   Padre.hasMany(Hijo, ...)   → FK en tabla Hijo
//   Hijo.belongsTo(Padre, ...) → espeja la FK, habilita eager loading
//
// Los M:M usan modelo pivot explícito (through) para acceder a
// columnas extra (cantidad, etc.) directamente.
// ─────────────────────────────────────────────────────────────────────────────

// Perfil ──< Usuario
Perfil.hasMany(Usuario, {
  foreignKey: 'perfilId',
  as: 'usuarios',
});
Usuario.belongsTo(Perfil, {
  foreignKey: 'perfilId',
  as: 'perfil',
});

// Usuario ──── Empleado  (1:1)
Usuario.hasOne(Empleado, {
  foreignKey: 'usuarioId',
  as: 'empleado',
});
Empleado.belongsTo(Usuario, {
  foreignKey: 'usuarioId',
  as: 'usuario',
});

// Sucursal ──< Empleado
Sucursal.hasMany(Empleado, {
  foreignKey: 'sucursalId',
  as: 'empleados',
});
Empleado.belongsTo(Sucursal, {
  foreignKey: 'sucursalId',
  as: 'sucursal',
});

// Cliente ──< Orden
Cliente.hasMany(Orden, {
  foreignKey: 'clienteId',
  as: 'ordenes',
});
Orden.belongsTo(Cliente, {
  foreignKey: 'clienteId',
  as: 'cliente',
});

// Sucursal ──< Orden
Sucursal.hasMany(Orden, {
  foreignKey: 'sucursalId',
  as: 'ordenes',
});
Orden.belongsTo(Sucursal, {
  foreignKey: 'sucursalId',
  as: 'sucursal',
});

// Empleado ──< Orden  (cajero que registró la orden)
Empleado.hasMany(Orden, {
  foreignKey: 'empleadoId',
  as: 'ordenes',
});
Orden.belongsTo(Empleado, {
  foreignKey: 'empleadoId',
  as: 'empleado',
});

// Orden ──< DetalleOrden
Orden.hasMany(DetalleOrden, {
  foreignKey: 'ordenId',
  as: 'detalles',
  onDelete: 'CASCADE',
});
DetalleOrden.belongsTo(Orden, {
  foreignKey: 'ordenId',
  as: 'orden',
});

// Producto ──< DetalleOrden
Producto.hasMany(DetalleOrden, {
  foreignKey: 'productoId',                        // ← corregido (era 'productId')
  as: 'detalleOrdenes',
});
DetalleOrden.belongsTo(Producto, {
  foreignKey: 'productoId',                        // ← corregido
  as: 'producto',
});

// Proveedor ──< Compra
Proveedor.hasMany(Compra, {
  foreignKey: 'proveedorId',                       // ← corregido (era 'supplierId')
  as: 'compras',
});
Compra.belongsTo(Proveedor, {
  foreignKey: 'proveedorId',                       // ← corregido
  as: 'proveedor',
});

// Sucursal ──< Compra
Sucursal.hasMany(Compra, {
  foreignKey: 'sucursalId',
  as: 'compras',
});
Compra.belongsTo(Sucursal, {
  foreignKey: 'sucursalId',
  as: 'sucursal',
});

// Empleado ──< Compra  (empleado que registró la compra)
Empleado.hasMany(Compra, {
  foreignKey: 'empleadoId',
  as: 'compras',
});
Compra.belongsTo(Empleado, {
  foreignKey: 'empleadoId',
  as: 'empleado',
});

// Compra ──< DetalleCompra
Compra.hasMany(DetalleCompra, {
  foreignKey: 'compraId',
  as: 'detalles',
  onDelete: 'CASCADE',
});
DetalleCompra.belongsTo(Compra, {
  foreignKey: 'compraId',
  as: 'compra',
});

// Insumo ──< DetalleCompra
Insumo.hasMany(DetalleCompra, {
  foreignKey: 'insumoId',
  as: 'detalleCompras',
});
DetalleCompra.belongsTo(Insumo, {
  foreignKey: 'insumoId',
  as: 'insumo',
});

// Insumo >──< Producto  (through InsumoProducto)
// Un insumo se usa en muchos productos; un producto requiere muchos insumos.
Insumo.belongsToMany(Producto, {
  through: InsumoProducto,
  foreignKey: 'insumoId',
  otherKey: 'productoId',
  as: 'productos',
});
Producto.belongsToMany(Insumo, {
  through: InsumoProducto,
  foreignKey: 'productoId',
  otherKey: 'insumoId',
  as: 'insumos',
});

// Acceso directo a filas pivot cuando se necesitan columnas extra (cantidad)
Insumo.hasMany(InsumoProducto, {
  foreignKey: 'insumoId',
  as: 'insumoProductos',
});
InsumoProducto.belongsTo(Insumo, {
  foreignKey: 'insumoId',
  as: 'insumo',
});

Producto.hasMany(InsumoProducto, {
  foreignKey: 'productoId',
  as: 'insumoProductos',
});
InsumoProducto.belongsTo(Producto, {
  foreignKey: 'productoId',
  as: 'producto',
});

// ── Exports ───────────────────────────────────────────────────────────────────
module.exports = {
  sequelize,
  Sequelize,
  Perfil,
  Sucursal,
  Usuario,
  Empleado,
  Cliente,
  Producto,
  Insumo,
  InsumoProducto,
  Proveedor,
  Orden,
  DetalleOrden,
  Compra,
  DetalleCompra,
};
