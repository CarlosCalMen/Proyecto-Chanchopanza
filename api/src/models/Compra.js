'use strict';

const { DataTypes, Model } = require('sequelize');

const ESTADO_COMPRA = ['pendiente', 'recibido', 'cancelado', 'anulado'];

class Compra extends Model {                         // ← corregido (era "class Purchase")
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        proveedorId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'proveedores', key: 'id' },
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
        fechaDeCompra: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        estado: {
          type: DataTypes.ENUM(...ESTADO_COMPRA),
          allowNull: false,
          defaultValue: 'pendiente',               // ← corregido (era 'pending')
          validate: {
            isIn: [ESTADO_COMPRA],
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
        modelName: 'Compra',
        tableName: 'compras',
        underscored: true,
        timestamps: true,
      }
    );
  }

  static associate(models) {}
}

module.exports = Compra;
module.exports.ESTADO_COMPRA = ESTADO_COMPRA;
