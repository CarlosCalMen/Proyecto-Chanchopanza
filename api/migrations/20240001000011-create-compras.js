'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('compras', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      proveedor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'proveedores', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      sucursal_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'sucursales', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      empleado_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'empleados', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      fecha_de_compra: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      estado: {
        type: Sequelize.ENUM('pendiente', 'recibido', 'cancelado', 'anulado'),
        allowNull: false,
        defaultValue: 'pendiente',
      },
      total: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
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

    await queryInterface.addIndex('compras', ['sucursal_id'],     { name: 'idx_compras_sucursal_id' });
    await queryInterface.addIndex('compras', ['proveedor_id'],    { name: 'idx_compras_proveedor_id' });
    await queryInterface.addIndex('compras', ['empleado_id'],     { name: 'idx_compras_empleado_id' });
    await queryInterface.addIndex('compras', ['fecha_de_compra'], { name: 'idx_compras_fecha' });
    await queryInterface.addIndex('compras', ['estado'],          { name: 'idx_compras_estado' });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_compras_estado";');
    await queryInterface.dropTable('compras');
  },
};
