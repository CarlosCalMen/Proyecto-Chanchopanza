'use strict';

const { DataTypes, Model } = require('sequelize');

const METODOS_PAGO = ['efectivo', 'tarjeta', 'yape', 'plin', 'transferencia'];
const ESTADO_PAGO  = ['registrado', 'anulado'];

class Pago extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        ordenId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'ordenes', key: 'id' },
        },
        empleadoId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'empleados', key: 'id' },
          comment: 'Empleado que realizó el cobro',
        },
        metodoPago: {
          type: DataTypes.ENUM(...METODOS_PAGO),
          allowNull: false,
          validate: { isIn: [METODOS_PAGO] },
        },
        monto: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          validate: { min: 0 },
          comment: 'Importe de este pago aplicado a la orden (la suma de los pagos vigentes iguala el total)',
        },
        montoRecibido: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          validate: { min: 0 },
          comment: 'Lo que entregó el cliente (en efectivo puede superar el monto)',
        },
        vuelto: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0.00,
          validate: { min: 0 },
        },
        estado: {
          type: DataTypes.ENUM(...ESTADO_PAGO),
          allowNull: false,
          defaultValue: 'registrado',
        },
        fechaDePago: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        modelName: 'Pago',
        tableName: 'pagos',
        underscored: true,
        timestamps: true,
      }
    );
  }

  static associate(models) {}
}

module.exports = Pago;
module.exports.METODOS_PAGO = METODOS_PAGO;
module.exports.ESTADO_PAGO  = ESTADO_PAGO;
