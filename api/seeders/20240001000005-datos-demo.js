'use strict';

/**
 * Datos de demostración opcionales:
 * clientes, proveedores, insumos y productos de ejemplo.
 *
 * Este seeder es independiente de los anteriores y puede
 * omitirse en producción ejecutando solo los primeros 4.
 *
 * Para ejecutar solo seeders específicos:
 *   npx sequelize-cli db:seed --seed 20240001000005-datos-demo.js
 *
 * Para revertir solo este seeder:
 *   npx sequelize-cli db:seed:undo --seed 20240001000005-datos-demo.js
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // ── Clientes ──────────────────────────────────────────────────────────────
    // ('Cliente Rápido', el cliente mostrador, lo crea la migración 16.)
    await queryInterface.bulkInsert('clientes', [
      { nombre: 'Juan Pérez',    telefono: '987-001-001', email: 'juan@email.com',  created_at: now, updated_at: now },
      { nombre: 'Ana García',    telefono: '987-001-002', email: 'ana@email.com',   created_at: now, updated_at: now },
      { nombre: 'Luis Torres',   telefono: '987-001-003', email: null,              created_at: now, updated_at: now },
      { nombre: 'Rosa Mendoza',  telefono: '987-001-004', email: 'rosa@email.com',  created_at: now, updated_at: now },
    ]);

    // ── Proveedores ───────────────────────────────────────────────────────────
    await queryInterface.bulkInsert('proveedores', [
      {
        nombre:            'Distribuidora La Merced',
        nombre_de_contacto:'Jorge Quispe',
        telefono:          '01-234-5678',
        email:             'ventas@lamerced.com',
        created_at: now, updated_at: now,
      },
      {
        nombre:            'Carnes del Norte SAC',
        nombre_de_contacto:'Patricia Vera',
        telefono:          '01-234-5679',
        email:             'pedidos@carnesnorte.com',
        created_at: now, updated_at: now,
      },
      {
        nombre:            'Lácteos San Marcos',
        nombre_de_contacto:'Roberto Díaz',
        telefono:          '01-234-5680',
        email:             null,
        created_at: now, updated_at: now,
      },
    ]);

    // ── Insumos ───────────────────────────────────────────────────────────────
    await queryInterface.bulkInsert('insumos', [
      { nombre: 'Arroz',         unidad: 'kg',     stock: 50.000, created_at: now, updated_at: now },
      { nombre: 'Pollo entero',  unidad: 'kg',     stock: 30.000, created_at: now, updated_at: now },
      { nombre: 'Papa blanca',   unidad: 'kg',     stock: 40.000, created_at: now, updated_at: now },
      { nombre: 'Aceite vegetal',unidad: 'lt',     stock: 20.000, created_at: now, updated_at: now },
      { nombre: 'Cebolla',       unidad: 'kg',     stock: 15.000, created_at: now, updated_at: now },
      { nombre: 'Tomate',        unidad: 'kg',     stock: 10.000, created_at: now, updated_at: now },
      { nombre: 'Ajo',           unidad: 'kg',     stock:  2.000, created_at: now, updated_at: now },
      { nombre: 'Sal',           unidad: 'kg',     stock:  5.000, created_at: now, updated_at: now },
      { nombre: 'Gaseosa 500ml', unidad: 'unidad', stock: 48.000, created_at: now, updated_at: now },
      { nombre: 'Agua 500ml',    unidad: 'unidad', stock: 24.000, created_at: now, updated_at: now },
    ]);

    // ── Productos ─────────────────────────────────────────────────────────────
    await queryInterface.bulkInsert('productos', [
      { nombre: 'Pollo a la brasa (1/4)',  descripcion: 'Cuarto de pollo a la brasa con papas y ensalada', precio_venta: 18.00, activo: true, created_at: now, updated_at: now },
      { nombre: 'Pollo a la brasa (1/2)',  descripcion: 'Medio pollo a la brasa con papas y ensalada',    precio_venta: 32.00, activo: true, created_at: now, updated_at: now },
      { nombre: 'Pollo a la brasa (1)',    descripcion: 'Pollo entero a la brasa con papas y ensalada',   precio_venta: 58.00, activo: true, created_at: now, updated_at: now },
      { nombre: 'Arroz con leche',         descripcion: 'Postre tradicional de arroz con leche',          precio_venta:  6.00, activo: true, created_at: now, updated_at: now },
      { nombre: 'Papas fritas porción',    descripcion: 'Porción adicional de papas fritas',              precio_venta:  8.00, activo: true, created_at: now, updated_at: now },
      { nombre: 'Gaseosa 500ml',           descripcion: 'Bebida gaseosa personal',                        precio_venta:  4.00, activo: true, created_at: now, updated_at: now },
      { nombre: 'Agua 500ml',              descripcion: 'Agua mineral personal',                          precio_venta:  2.50, activo: true, created_at: now, updated_at: now },
    ]);

    // ── Recetas (insumo_productos) ────────────────────────────────────────────
    // Obtener ids de productos e insumos recién insertados
    const productos = await queryInterface.sequelize.query(
      `SELECT id, nombre FROM productos WHERE nombre IN (
        'Pollo a la brasa (1/4)','Pollo a la brasa (1/2)','Pollo a la brasa (1)',
        'Papas fritas porción','Gaseosa 500ml','Agua 500ml'
      )`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const insumos = await queryInterface.sequelize.query(
      `SELECT id, nombre FROM insumos WHERE nombre IN (
        'Pollo entero','Papa blanca','Aceite vegetal','Cebolla',
        'Tomate','Ajo','Sal','Gaseosa 500ml','Agua 500ml'
      )`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const pid = (nombre) => productos.find((p) => p.nombre === nombre)?.id;
    const iid = (nombre) => insumos.find((i) => i.nombre === nombre)?.id;

    const recetas = [
      // Pollo 1/4 → 0.25 kg pollo, 0.2 kg papa, 0.01 lt aceite, 0.02 kg sal
      { producto_id: pid('Pollo a la brasa (1/4)'), insumo_id: iid('Pollo entero'),  cantidad: 0.250 },
      { producto_id: pid('Pollo a la brasa (1/4)'), insumo_id: iid('Papa blanca'),   cantidad: 0.200 },
      { producto_id: pid('Pollo a la brasa (1/4)'), insumo_id: iid('Aceite vegetal'),cantidad: 0.010 },
      { producto_id: pid('Pollo a la brasa (1/4)'), insumo_id: iid('Sal'),            cantidad: 0.005 },
      // Pollo 1/2
      { producto_id: pid('Pollo a la brasa (1/2)'), insumo_id: iid('Pollo entero'),  cantidad: 0.500 },
      { producto_id: pid('Pollo a la brasa (1/2)'), insumo_id: iid('Papa blanca'),   cantidad: 0.400 },
      { producto_id: pid('Pollo a la brasa (1/2)'), insumo_id: iid('Aceite vegetal'),cantidad: 0.020 },
      { producto_id: pid('Pollo a la brasa (1/2)'), insumo_id: iid('Sal'),            cantidad: 0.010 },
      // Pollo entero
      { producto_id: pid('Pollo a la brasa (1)'),   insumo_id: iid('Pollo entero'),  cantidad: 1.000 },
      { producto_id: pid('Pollo a la brasa (1)'),   insumo_id: iid('Papa blanca'),   cantidad: 0.800 },
      { producto_id: pid('Pollo a la brasa (1)'),   insumo_id: iid('Aceite vegetal'),cantidad: 0.040 },
      { producto_id: pid('Pollo a la brasa (1)'),   insumo_id: iid('Sal'),            cantidad: 0.020 },
      // Papas fritas
      { producto_id: pid('Papas fritas porción'),   insumo_id: iid('Papa blanca'),   cantidad: 0.300 },
      { producto_id: pid('Papas fritas porción'),   insumo_id: iid('Aceite vegetal'),cantidad: 0.050 },
      { producto_id: pid('Papas fritas porción'),   insumo_id: iid('Sal'),            cantidad: 0.003 },
      // Bebidas (1 unidad = 1 unidad de insumo)
      { producto_id: pid('Gaseosa 500ml'),           insumo_id: iid('Gaseosa 500ml'), cantidad: 1.000 },
      { producto_id: pid('Agua 500ml'),              insumo_id: iid('Agua 500ml'),    cantidad: 1.000 },
    ].filter((r) => r.producto_id && r.insumo_id); // omite entradas con id null

    if (recetas.length > 0) {
      await queryInterface.bulkInsert(
        'insumo_productos',
        recetas.map((r) => ({ ...r, created_at: now, updated_at: now }))
      );
    }
  },

  async down(queryInterface) {
    // El orden importa por las FKs
    await queryInterface.bulkDelete('insumo_productos', null);
    await queryInterface.bulkDelete('productos', {
      nombre: [
        'Pollo a la brasa (1/4)', 'Pollo a la brasa (1/2)', 'Pollo a la brasa (1)',
        'Arroz con leche', 'Papas fritas porción', 'Gaseosa 500ml', 'Agua 500ml',
      ],
    });
    await queryInterface.bulkDelete('insumos', {
      nombre: [
        'Arroz', 'Pollo entero', 'Papa blanca', 'Aceite vegetal',
        'Cebolla', 'Tomate', 'Ajo', 'Sal', 'Gaseosa 500ml', 'Agua 500ml',
      ],
    });
    await queryInterface.bulkDelete('proveedores', {
      nombre: ['Distribuidora La Merced', 'Carnes del Norte SAC', 'Lácteos San Marcos'],
    });
    await queryInterface.bulkDelete('clientes', {
      nombre: ['Juan Pérez', 'Ana García', 'Luis Torres', 'Rosa Mendoza'],
    });
  },
};
