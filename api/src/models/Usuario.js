'use strict';

const { DataTypes, Model } = require('sequelize');

class Usuario extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        perfilId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'perfiles', key: 'id' },   // ← corregido
        },
        nombreUsuario: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
          validate: {
            notEmpty: true,
            len: [3, 50],
          },
        },
        passwordHash: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        activo: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
      },
      {
        sequelize,
        modelName: 'Usuario',
        tableName: 'usuarios',
        underscored: true,
        timestamps: true,
        defaultScope: {
          attributes: { exclude: ['passwordHash'] },
        },
        scopes: {
          withPassword: {
            attributes: { include: ['passwordHash'] },
          },
        },
      }
    );
  }

  static associate(models) {}
}

module.exports = Usuario;
