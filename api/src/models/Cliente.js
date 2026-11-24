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
