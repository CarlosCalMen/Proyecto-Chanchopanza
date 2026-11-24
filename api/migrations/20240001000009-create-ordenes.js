'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ordenes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      cliente_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'clientes', key: 'id' },
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
      fecha_de_orden: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      estado: {
        type: Sequelize.ENUM('pendiente', 'en_proceso', 'completado', 'cancelado', 'anulado'),
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

    await queryInterface.addIndex('ordenes', ['sucursal_id'],  { name: 'idx_ordenes_sucursal_id' });
    await queryInterface.addIndex('ordenes', ['cliente_id'],   { name: 'idx_ordenes_cliente_id' });
    await queryInterface.addIndex('ordenes', ['empleado_id'],  { name: 'idx_ordenes_empleado_id' });
    await queryInterface.addIndex('ordenes', ['fecha_de_orden'], { name: 'idx_ordenes_fecha' });
    await queryInterface.addIndex('ordenes', ['estado'],       { name: 'idx_ordenes_estado' });
  },

  async down(queryInterface) {
    // Primero la tabla (depende del ENUM) y después el tipo
    await queryInterface.dropTable('ordenes');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ordenes_estado";');
  },
};
