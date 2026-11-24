'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('perfiles', [
      {
        nombre:          'Administrador',
        etiqueta_perfil: 'admin',
        created_at:      new Date(),
        updated_at:      new Date(),
      },
      {
        nombre:          'Socio',
        etiqueta_perfil: 'socio',
        created_at:      new Date(),
        updated_at:      new Date(),
      },
      {
        nombre:          'Cajero',
        etiqueta_perfil: 'caja',
        created_at:      new Date(),
        updated_at:      new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('perfiles', {
      etiqueta_perfil: ['admin', 'socio', 'caja'],
    });
  },
};
