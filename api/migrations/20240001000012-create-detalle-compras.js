'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('detalle_compras', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      compra_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'compras', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Cascade: si se elimina la compra, se eliminan sus detalles',
      },
      insumo_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'insumos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      cantidad: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false,
        defaultValue: 0.000,
      },
      costo_unitario: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Costo al momento de la compra (snapshot)',
      },
      subtotal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'cantidad * costo_unitario — persistido para rendimiento en reportes',
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

    await queryInterface.addIndex('detalle_compras', ['compra_id'], { name: 'idx_detalle_compras_compra_id' });
    await queryInterface.addIndex('detalle_compras', ['insumo_id'], { name: 'idx_detalle_compras_insumo_id' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('detalle_compras');
  },
};
