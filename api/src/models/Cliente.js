'use strict';

const { DataTypes, Model } = require('sequelize');

class Cliente extends Model {
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
          validate: { notEmpty: true },
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
        esMostrador: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Cliente por defecto de las ventas sin datos del cliente (solo uno)',
        },
      },
      {
        sequelize,
        modelName: 'Cliente',
        tableName: 'clientes',
        underscored: true,
        timestamps: true,
      }
    );
  }

  static associate(models) {}
}

module.exports = Cliente;
