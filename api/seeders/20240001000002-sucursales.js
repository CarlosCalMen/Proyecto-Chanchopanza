'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('sucursales', [
      {
        nombre:     'Sucursal Central',
        direccion:  'Av. Principal 123',
        telefono:   '999-000-001',
        activo:     true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        nombre:     'Sucursal Norte',
        direccion:  'Calle Los Pinos 456',
        telefono:   '999-000-002',
        activo:     true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('sucursales', {
      nombre: ['Sucursal Central', 'Sucursal Norte'],
    });
  },
};
