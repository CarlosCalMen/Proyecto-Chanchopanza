'use strict';

const { DataTypes, Model } = require('sequelize');

class Producto extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        nombre: {
          type: DataTypes.STRING(120),
          allowNull: false,
          unique: true,
          validate: { notEmpty: true },
        },
        descripcion: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        precioVenta: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0.00,
          validate: { min: 0 },
        },
        activo: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
      },
      {
        sequelize,
        modelName: 'Producto',
        tableName: 'productos',
        underscored: true,
        timestamps: true,
      }
    );
  }

  static associate(models) {}
}

module.exports = Producto;
