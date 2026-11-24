'use strict';

const { DataTypes, Model } = require('sequelize');

class InsumoProducto extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        insumoId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'insumos', key: 'id' },    // ← corregido
        },
        productoId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'productos', key: 'id' },  // ← corregido
        },
        cantidad: {
          type: DataTypes.DECIMAL(10, 3),
          allowNull: false,
          defaultValue: 0.000,
          validate: { min: 0.001 },
          comment: 'Cantidad de este insumo necesaria para producir una unidad del producto',
        },
      },
      {
        sequelize,
        modelName: 'InsumoProducto',
        tableName: 'insumo_productos',
        underscored: true,
        timestamps: true,
      }
    );
  }

  static associate(models) {}
}

module.exports = InsumoProducto;
