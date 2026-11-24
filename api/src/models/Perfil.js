'use strict';

const { DataTypes, Model } = require('sequelize');

class Perfil extends Model {
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
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
          validate: { notEmpty: true },
        },
        etiquetaPerfil: {
          type: DataTypes.STRING(20),
          allowNull: false,
          unique: true,
          validate: {
            notEmpty: true,
            isIn: [['admin', 'socio', 'caja']],
          },
        },
      },
      {
        sequelize,
        modelName: 'Perfil',
        tableName: 'perfiles',
        underscored: true,
        timestamps: true,
      }
    );
  }

  static associate(models) {}
}

module.exports = Perfil;
