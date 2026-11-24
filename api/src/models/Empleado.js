'use strict';

const { DataTypes, Model } = require('sequelize');

class Empleado extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        usuarioId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          unique: true,
          references: { model: 'usuarios', key: 'id' },   // ← corregido
        },
        sucursalId: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'sucursales', key: 'id' }, // ← corregido
        },
        nombre: {
          type: DataTypes.STRING(80),
          allowNull: false,
          validate: { notEmpty: true },
        },
        apellidos: {
          type: DataTypes.STRING(80),
          allowNull: false,
          validate: { notEmpty: true },
        },
        telefono: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'Empleado',
        tableName: 'empleados',
        underscored: true,
        timestamps: true,
      }
    );
  }

  get nombreCompleto() {
    return `${this.nombre} ${this.apellidos}`;
  }

  static associate(models) {}
}

module.exports = Empleado;
