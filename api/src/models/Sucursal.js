'use strict';

const { DataTypes, Model } = require('sequelize');

class Sucursal extends Model {
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
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true,
          validate: { notEmpty: true },
        },
        direccion: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        telefono: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        activo: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
      },
      {
        sequelize,
        modelName: 'Sucursal',
        tableName: 'sucursales',
        underscored: true,
        timestamps: true,
      }
    );
  }

  static associate(models) {}
}

module.exports = Sucursal;
