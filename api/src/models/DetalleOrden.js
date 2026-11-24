'use strict';

const { DataTypes, Model } = require('sequelize');

class DetalleOrden extends Model {                   // ← clase con mayúscula (normalizado)
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
        productoId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'productos', key: 'id' },
        },
        cantidad: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
          validate: { min: 1 },
        },
        precioUnitario: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          validate: { min: 0 },
          comment: 'Precio al momento de la venta (snapshot)',
        },
        subtotal: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          validate: { min: 0 },
          comment: 'cantidad * precioUnitario — persistido para rendimiento en reportes',
        },
      },
      {
        sequelize,
        modelName: 'DetalleOrden',
        tableName: 'detalle_ordenes',               // ← snake_case correcto para PostgreSQL
        underscored: true,
        timestamps: true,
      }
    );
  }

  static associate(models) {}
}

module.exports = DetalleOrden;
