'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('insumos', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      nombre: {
        type: Sequelize.STRING(120),
        allowNull: false,
        unique: true,
      },
      unidad: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'Unidad de medida: kg, lt, unidad, etc.',
      },
      stock: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false,
        defaultValue: 0.000,
        comment: 'Stock actual consolidado de todas las sucursales',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('insumos');
  },
};
