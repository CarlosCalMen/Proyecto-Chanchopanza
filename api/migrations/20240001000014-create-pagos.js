'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pagos', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      orden_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'ordenes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      empleado_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'empleados', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'Empleado que realizó el cobro',
      },
      metodo_pago: {
        type: Sequelize.ENUM('efectivo', 'tarjeta', 'yape', 'plin', 'transferencia'),
        allowNull: false,
      },
      monto: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Importe aplicado a la orden (igual al total de la orden)',
      },
      monto_recibido: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Lo que entregó el cliente (en efectivo puede superar el monto)',
      },
      vuelto: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      estado: {
        type: Sequelize.ENUM('registrado', 'anulado'),
        allowNull: false,
        defaultValue: 'registrado',
      },
      fecha_de_pago: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
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

    await queryInterface.addIndex('pagos', ['empleado_id'],   { name: 'idx_pagos_empleado_id' });
    await queryInterface.addIndex('pagos', ['fecha_de_pago'], { name: 'idx_pagos_fecha' });
    await queryInterface.addIndex('pagos', ['metodo_pago'],   { name: 'idx_pagos_metodo' });

    // Regla de integridad: una orden solo puede tener UN cobro vigente.
    // Los cobros anulados no cuentan, así que una orden puede re-cobrarse.
    await queryInterface.addIndex('pagos', ['orden_id'], {
      name: 'uq_pagos_orden_registrado',
      unique: true,
      where: { estado: 'registrado' },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('pagos');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pagos_metodo_pago";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_pagos_estado";');
  },
};
