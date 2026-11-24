'use strict';

const { DataTypes, Model } = require('sequelize');

class Proveedor extends Model {
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
          type: DataTypes.STRING(150),
          allowNull: false,
          unique: true,
          validate: { notEmpty: true },
        },
        nombreDeContacto: {
          type: DataTypes.STRING(150),
          allowNull: true,
        },
        telefono: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        email: {
          type: DataTypes.STRING(120),
          allowNull: true,
          unique: true,
          validate: { isEmail: true },
        },
      },
      {
        sequelize,
        modelName: 'Proveedor',
        tableName: 'proveedores',
        underscored: true,
        timestamps: true,
      }
    );
  }

  static associate(models) {}
}

module.exports = Proveedor;
