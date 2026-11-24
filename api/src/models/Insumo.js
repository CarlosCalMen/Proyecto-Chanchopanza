'use strict';

const { DataTypes, Model } = require('sequelize');

class Insumo extends Model {
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
        unidad: {
          type: DataTypes.STRING(20),
          allowNull: false,
          validate: { notEmpty: true },
        },
        stock: {
          type: DataTypes.DECIMAL(10, 3),
          allowNull: false,
          defaultValue: 0.000,
          validate: { min: 0 },
        },
      },
      {
        sequelize,
        modelName: 'Insumo',
        tableName: 'insumos',
        underscored: true,
        timestamps: true,
      }
    );
  }

  static associate(models) {}
}

module.exports = Insumo;
