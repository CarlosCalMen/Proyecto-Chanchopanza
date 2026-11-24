'use strict';

const express      = require('express');
const cookieParser = require('cookie-parser');
const cors         = require('cors');

const errorMiddleware = require('./middlewares/error.middleware');

// ── Rutas ─────────────────────────────────────────────────────────────────────
const authRoutes      = require('./modules/auth/auth.routes');
const productoRoutes  = require('./modules/products/product.routes');
const sucursalRoutes  = require('./modules/sucursales/sucursal.routes');
const clienteRoutes   = require('./modules/clientes/cliente.routes');
const proveedorRoutes = require('./modules/proveedores/proveedor.routes');
const insumoRoutes    = require('./modules/insumos/insumo.routes');
const ordenRoutes     = require('./modules/ordenes/orden.routes');
const compraRoutes    = require('./modules/compras/compra.routes');
const reporteRoutes   = require('./modules/reportes/reporte.routes');

const app = express();

// ── Middleware global ─────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ── Registro de rutas ─────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/productos',  productoRoutes);
app.use('/api/sucursales', sucursalRoutes);
app.use('/api/clientes',   clienteRoutes);
app.use('/api/proveedores',proveedorRoutes);
app.use('/api/insumos',    insumoRoutes);
app.use('/api/ordenes',    ordenRoutes);
app.use('/api/compras',    compraRoutes);
app.use('/api/reportes',   reporteRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

// ── Manejador central de errores (siempre al final) ───────────────────────────
app.use(errorMiddleware);

module.exports = app;
