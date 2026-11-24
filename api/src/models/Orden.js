'use strict';

const { DataTypes, Model } = require('sequelize');

const ESTADO_ORDEN = ['pendiente', 'en_proceso', 'completado', 'cancelado', 'anulado'];

class Orden extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        clienteId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'clientes', key: 'id' },
        },
        sucursalId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'sucursales', key: 'id' },
        },
        empleadoId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'empleados', key: 'id' },
        },
        fechaDeOrden: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        estado: {
          type: DataTypes.ENUM(...ESTADO_ORDEN),
          allowNull: false,
          defaultValue: 'pendiente',              // ← corregido
          validate: {
            isIn: [ESTADO_ORDEN],                 // ← corregido (usaba ORDER_STATUSES)
          },
        },
        total: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0.00,
          validate: { min: 0 },
        },
      },
      {
        sequelize,
        modelName: 'Orden',
        tableName: 'ordenes',
        underscored: true,
        timestamps: true,
      }
    );
  }

  static associate(models) {}
}

module.exports = Orden;
module.exports.ESTADO_ORDEN = ESTADO_ORDEN;
