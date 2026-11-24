'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('insumo_productos', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      insumo_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'insumos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      producto_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'productos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      cantidad: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false,
        defaultValue: 0.000,
        comment: 'Cantidad de este insumo necesaria para producir una unidad del producto',
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

    // Un insumo solo puede aparecer una vez por producto
    await queryInterface.addIndex('insumo_productos', ['insumo_id', 'producto_id'], {
      name: 'idx_insumo_productos_unique',
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('insumo_productos');
  },
};
